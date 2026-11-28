import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { ADJUSTMENT_CATEGORY_FILTER, getStartDate } from "@/lib/cash-period";
import { getClosingPeriod, saleDay } from "@/lib/cash-count";
import { closedReason } from "@/lib/closed-days";
import { getClosedDays } from "@/lib/closed-days-store";

type SessionUser = { role?: string };

const MANAGERS = ["ADMIN", "MANAGER"];
const LOW_STOCK = 5;
const DAYS = 7;

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const shiftDay = (day: string, by: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + by * 86400_000).toISOString().slice(0, 10);
/** A business day runs from 06:00 (Kinshasa) to 06:00 the next morning, as in the closures. */
const dayStart = (day: string) => new Date(`${day}T06:00:00+01:00`);

/**
 * GET: the dashboard, from the database only. "Today" is the business day: before 06:00 the
 * evening's sales still belong to the day before. Amounts are in FC with their USD value as
 * recorded at the time of each sale.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const isManager = MANAGERS.includes((session.user as SessionUser).role ?? "");

  try {
    const now = new Date();
    const today = saleDay(now);
    const firstDay = shiftDay(today, -(DAYS - 1));
    const sameDayLastWeek = shiftDay(today, -7);

    const startDate = await getStartDate();
    // Sales before the start-up closure are archived: they count nowhere.
    const since = (d: Date) => (startDate && startDate > d ? startDate : d);
    const todayRange = { gte: since(dayStart(today)), lt: dayStart(shiftDay(today, 1)) };
    const weekRange = { gte: since(dayStart(firstDay)), lt: todayRange.lt };
    const lastWeekRange = { gte: since(dayStart(sameDayLastWeek)), lt: dayStart(shiftDay(sameDayLastWeek, 1)) };

    const [todaySales, weekSales, lastWeek, expenses, items, recent, rateRow, closedDays] = await Promise.all([
      prisma.sale.findMany({
        where: { status: "COMPLETED", createdAt: todayRange },
        select: { totalCdf: true, totalNet: true, paymentMethod: true },
      }),
      prisma.sale.findMany({
        where: { status: "COMPLETED", createdAt: weekRange },
        select: { createdAt: true, totalCdf: true },
      }),
      prisma.sale.aggregate({
        where: { status: "COMPLETED", createdAt: lastWeekRange },
        _sum: { totalCdf: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { date: todayRange, source: "CASH_REGISTER", NOT: ADJUSTMENT_CATEGORY_FILTER },
        _sum: { amount: true },
      }),
      prisma.saleItem.findMany({
        where: { sale: { status: "COMPLETED", createdAt: weekRange } },
        select: {
          quantity: true,
          unitPriceCdf: true,
          productId: true,
          product: { select: { name: true, type: true } },
          sale: { select: { createdAt: true } },
        },
      }),
      prisma.sale.findMany({
        where: { status: "COMPLETED", ...(startDate ? { createdAt: { gte: startDate } } : {}) },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          ticketNum: true,
          createdAt: true,
          totalCdf: true,
          totalNet: true,
          paymentMethod: true,
          user: { select: { name: true } },
        },
      }),
      prisma.exchangeRate.findFirst({
        where: { active: true },
        orderBy: { effectiveDate: "desc" },
        select: { rateUsdToCdf: true },
      }),
      getClosedDays(),
    ]);

    // ---- today
    let totalCdf = 0;
    let totalUsd = 0;
    let cashCdf = 0;
    for (const s of todaySales) {
      totalCdf += num(s.totalCdf);
      totalUsd += num(s.totalNet);
      if (s.paymentMethod === "CASH") cashCdf += num(s.totalCdf);
    }
    const salesCount = todaySales.length;
    const expensesCdf = num(expenses._sum.amount);

    let beverageCdf = 0;
    let foodCdf = 0;
    for (const it of items) {
      if (saleDay(it.sale.createdAt) !== today) continue;
      const v = num(it.quantity) * num(it.unitPriceCdf);
      if (it.product.type === "BEVERAGE") beverageCdf += v;
      else if (it.product.type === "FOOD") foodCdf += v;
    }

    // ---- last 7 days, day by day
    const byDay = new Map<string, { totalCdf: number; count: number }>();
    for (let i = 0; i < DAYS; i++) byDay.set(shiftDay(firstDay, i), { totalCdf: 0, count: 0 });
    for (const s of weekSales) {
      const row = byDay.get(saleDay(s.createdAt));
      if (!row) continue;
      row.totalCdf += num(s.totalCdf);
      row.count += 1;
    }
    const week = [...byDay.entries()].map(([day, v]) => ({
      day,
      totalCdf: Math.round(v.totalCdf),
      count: v.count,
      closed: closedReason(day, closedDays),
    }));

    // ---- best sellers over the 7 days
    const byProduct = new Map<string, { name: string; type: string; quantity: number; totalCdf: number }>();
    for (const it of items) {
      const row = byProduct.get(it.productId) ?? { name: it.product.name, type: it.product.type, quantity: 0, totalCdf: 0 };
      row.quantity += num(it.quantity);
      row.totalCdf += num(it.quantity) * num(it.unitPriceCdf);
      byProduct.set(it.productId, row);
    }
    const topProducts = [...byProduct.values()]
      .sort((a, b) => b.totalCdf - a.totalCdf)
      .slice(0, 6)
      .map((p) => ({ ...p, totalCdf: Math.round(p.totalCdf) }));

    // ---- for the manager: days to close, gaps to check, low stock
    let manager = null;
    if (isManager) {
      const [closing, gaps, stock] = await Promise.all([
        getClosingPeriod(now),
        prisma.cashCount.aggregate({ where: { status: "TO_VERIFY" }, _count: true, _sum: { differenceCdf: true } }),
        prisma.product.findMany({
          where: { active: true, vendable: true },
          select: { id: true, name: true, stockItems: { select: { quantity: true } } },
        }),
      ]);
      const lowStock = stock
        .map((p) => ({ id: p.id, name: p.name, quantity: p.stockItems.reduce((a, s) => a + num(s.quantity), 0) }))
        .filter((p) => p.quantity <= LOW_STOCK)
        .sort((a, b) => a.quantity - b.quantity);
      manager = {
        pendingDays: closing.ready ? closing.pendingDays : [],
        gaps: { count: gaps._count, totalCdf: num(gaps._sum.differenceCdf) },
        lowStock: { count: lowStock.length, items: lowStock.slice(0, 6) },
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        rate: num(rateRow?.rateUsdToCdf) || null,
        today: {
          day: today,
          closed: closedReason(today, closedDays),
          salesCount,
          totalCdf: Math.round(totalCdf),
          totalUsd: Math.round(totalUsd * 100) / 100,
          cashCdf: Math.round(cashCdf),
          otherCdf: Math.round(totalCdf - cashCdf),
          avgCdf: salesCount ? Math.round(totalCdf / salesCount) : 0,
          expensesCdf: Math.round(expensesCdf),
          beverageCdf: Math.round(beverageCdf),
          foodCdf: Math.round(foodCdf),
          lastWeek: { day: sameDayLastWeek, totalCdf: Math.round(num(lastWeek._sum.totalCdf)), salesCount: lastWeek._count },
        },
        week,
        topProducts,
        recent: recent.map((s) => ({
          id: s.id,
          ticketNum: s.ticketNum,
          createdAt: s.createdAt,
          totalCdf: Math.round(num(s.totalCdf)),
          totalUsd: num(s.totalNet),
          paymentMethod: s.paymentMethod,
          cashier: s.user.name,
        })),
        manager,
      },
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
