import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import {
  ADJUSTMENT_CATEGORY_FILTER,
  computeTheoreticalBalance,
  ensureAdjustmentCategoryId,
  getCashPeriodTotals,
  getLastCashClosure,
  getOpeningBalance,
  getStartDate,
} from "@/lib/cash-period";
import { getCashExpectation, getOpenDayPeriod } from "@/lib/cash-count";

type SessionUser = { id?: string; name?: string | null; role?: string };

const MANAGERS = ["ADMIN", "MANAGER"];
const DEFAULT_RATE = 2850;

async function activeRate(): Promise<number> {
  const row = await prisma.exchangeRate.findFirst({
    where: { active: true },
    orderBy: { effectiveDate: "desc" },
    select: { rateUsdToCdf: true },
  });
  const rate = Number(row?.rateUsdToCdf ?? DEFAULT_RATE);
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_RATE;
}

/** The Caisse balance since the last start-up / month closure, and what it is made of. */
async function caisseState() {
  const lastClosure = await getLastCashClosure();
  const openingBalance = getOpeningBalance(lastClosure);
  const since = lastClosure?.closedAt ?? new Date(0);
  const range = { gte: since, lte: new Date() };

  const [totals, otherSales, cashSalesCount, ownerExpenses, ownerPurchases] = await Promise.all([
    getCashPeriodTotals(range),
    prisma.sale.aggregate({
      where: { createdAt: range, status: "COMPLETED", paymentMethod: { not: "CASH" } },
      _sum: { totalCdf: true },
      _count: true,
    }),
    prisma.sale.count({ where: { createdAt: range, status: "COMPLETED", paymentMethod: "CASH" } }),
    prisma.expense.aggregate({
      where: { date: range, source: "OWNER_CAPITAL", NOT: ADJUSTMENT_CATEGORY_FILTER },
      _sum: { amount: true },
    }),
    prisma.investment.aggregate({
      where: { date: range, source: "OWNER_CAPITAL" },
      _sum: { totalAmountCdf: true },
    }),
  ]);

  return {
    lastClosure,
    openingBalance,
    since: lastClosure?.closedAt ?? null,
    totals,
    balance: Math.round(computeTheoreticalBalance(openingBalance, totals)),
    otherSales: { cdf: Number(otherSales._sum.totalCdf ?? 0), count: otherSales._count },
    cashSalesCount,
    ownerExpensesCdf: Number(ownerExpenses._sum.amount ?? 0),
    ownerPurchasesCdf: Number(ownerPurchases._sum.totalAmountCdf ?? 0),
  };
}

type CountMeta = {
  usd: number;
  cdf: number;
  rate: number;
  totalCdf: number;
  theoreticalCdf: number;
  differenceCdf: number;
  notes?: string | null;
  expenseId?: string | null;
};

/** GET: the Caisse balance, its breakdown, the open day, recent counts and closures. */
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });
  if (!MANAGERS.includes(user.role ?? "")) {
    return NextResponse.json({ success: false, error: "Réservé au gérant et à l'administrateur" }, { status: 403 });
  }

  try {
    const [state, rate, startDate, open, countLogs, closures] = await Promise.all([
      caisseState(),
      activeRate(),
      getStartDate(),
      getOpenDayPeriod(),
      prisma.auditLog.findMany({
        where: { action: "CASH_COUNT", entity: "Caisse" },
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { user: { select: { name: true } } },
      }),
      prisma.cashMonthClosure.findMany({
        orderBy: { closedAt: "desc" },
        take: 12,
        include: { user: { select: { name: true } } },
      }),
    ]);

    const expectation = await getCashExpectation(open.periodStart, open.periodEnd);
    const canRedoStart =
      startDate !== null &&
      (await prisma.cashCount.count({ where: { periodEnd: { gte: startDate } } })) === 0;

    const t = state.totals;
    return NextResponse.json({
      success: true,
      data: {
        rate,
        startDate,
        canRedoStart,
        base: state.lastClosure
          ? {
              kind: state.lastClosure.kind,
              label: state.lastClosure.label,
              at: state.lastClosure.closedAt,
              amountCdf: state.openingBalance,
              notes: state.lastClosure.notes,
            }
          : null,
        breakdown: {
          openingCdf: state.openingBalance,
          salesCashCdf: Math.round(t.totalSales),
          salesCashCount: state.cashSalesCount,
          expensesCdf: Math.round(t.totalExpenses),
          purchasesCdf: Math.round(t.totalPurchases),
          adjustmentsCdf: Math.round(t.totalAdjustments ?? 0),
          handedToOwnerCdf: Math.round(t.totalWithdrawals ?? 0),
          salesOtherCdf: Math.round(state.otherSales.cdf),
          salesOtherCount: state.otherSales.count,
          ownerExpensesCdf: Math.round(state.ownerExpensesCdf),
          ownerPurchasesCdf: Math.round(state.ownerPurchasesCdf),
        },
        balanceCdf: state.balance,
        openDay: {
          ready: open.ready,
          since: open.periodStart,
          salesCount: expectation.salesCount,
          salesCashCdf: expectation.salesCashCdf,
        },
        counts: countLogs.map((log) => {
          const m = (log.metadata ?? {}) as Partial<CountMeta>;
          return {
            id: log.id,
            at: log.createdAt,
            userName: log.user.name,
            usd: Number(m.usd ?? 0),
            cdf: Number(m.cdf ?? 0),
            rate: Number(m.rate ?? 0),
            totalCdf: Number(m.totalCdf ?? 0),
            theoreticalCdf: Number(m.theoreticalCdf ?? 0),
            differenceCdf: Number(m.differenceCdf ?? 0),
            notes: m.notes ?? null,
          };
        }),
        closures: closures.map((c) => ({
          id: c.id,
          kind: c.kind,
          label: c.label,
          closedAt: c.closedAt,
          closingBalanceCdf: Number(c.closingBalanceCdf),
          totalSalesCdf: Number(c.totalSalesCdf),
          adjustmentCdf: Number(c.adjustmentCdf),
          notes: c.notes,
          userName: c.user.name,
        })),
      },
    });
  } catch (error) {
    console.error("[CAISSE_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST {usd, cdf, notes?}: the money of the Caisse is counted, dollars and francs apart.
 * The total in FC (dollars at the active rate) becomes the balance: a gap is booked as a
 * correction ("Ajustement de Caisse"), which the day closure ignores.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });
  if (!MANAGERS.includes(user.role ?? "")) {
    return NextResponse.json(
      { success: false, error: "Le comptage de la caisse est fait par le gérant ou l'administrateur" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const usd = Math.round(Number(body.usd ?? 0) * 100) / 100;
    const cdf = Math.round(Number(body.cdf ?? 0));
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 300) : "";
    if (!Number.isFinite(usd) || usd < 0 || !Number.isFinite(cdf) || cdf < 0) {
      return NextResponse.json({ success: false, error: "Montants invalides" }, { status: 400 });
    }

    if (!(await getStartDate())) {
      return NextResponse.json(
        { success: false, error: "Faites d'abord la clôture de démarrage (bouton « Démarrage »)." },
        { status: 400 }
      );
    }

    const [rate, state] = await Promise.all([activeRate(), caisseState()]);
    const totalCdf = Math.round(usd * rate + cdf);
    const differenceCdf = totalCdf - state.balance;

    const detail = `${usd.toLocaleString("fr-FR")} $ + ${cdf.toLocaleString("fr-FR")} FC (taux ${rate.toLocaleString("fr-FR")})`;
    let expenseId: string | null = null;
    if (differenceCdf !== 0) {
      const categoryId = await ensureAdjustmentCategoryId();
      const expense = await prisma.expense.create({
        data: {
          description: `Comptage de la caisse : ${detail} — ${differenceCdf > 0 ? "surplus" : "manquant"}${notes ? ` · ${notes}` : ""}`,
          // A surplus is money found (negative correction), a shortfall money missing.
          amount: new Prisma.Decimal(-differenceCdf),
          categoryId,
          source: "CASH_REGISTER",
          userId: user.id,
          date: new Date(),
        },
      });
      expenseId = expense.id;
    }

    const meta: CountMeta = {
      usd,
      cdf,
      rate,
      totalCdf,
      theoreticalCdf: state.balance,
      differenceCdf,
      notes: notes || null,
      expenseId,
    };
    await createAuditLog({ userId: user.id, action: "CASH_COUNT", entity: "Caisse", entityId: expenseId ?? undefined, metadata: meta });

    return NextResponse.json({ success: true, data: meta });
  } catch (error) {
    console.error("[CAISSE_POST]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
