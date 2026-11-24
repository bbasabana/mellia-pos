import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { ADJUSTMENT_CATEGORY_FILTER } from "@/lib/cash-period";
import { closureDays } from "@/lib/cash-count";
import { dayStatuses, kinshasaDay } from "@/lib/cash-days";
import { kinshasaToday } from "@/lib/closed-days";
import { getClosedDays } from "@/lib/closed-days-store";
import { activeRate, caisseState } from "@/lib/caisse-state";

type SessionUser = { name?: string | null; role?: string };

const SOURCE = { CASH_REGISTER: "Caisse", OWNER_CAPITAL: "Patron" } as Record<string, string>;
const n = (v: unknown) => Math.round(Number(v ?? 0));

/**
 * GET: the whole Caisse since the last start-up / month closure, for the PDF report —
 * balance and what it is made of, every day (closed, closed restaurant, still to close),
 * the day closures, the counts of the money in hand, the expenses and the purchases.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (!["ADMIN", "MANAGER"].includes(user.role ?? "")) {
    return NextResponse.json({ success: false, error: "Réservé au gérant et à l'administrateur" }, { status: 403 });
  }

  try {
    const [state, rate, closedDays] = await Promise.all([caisseState(), activeRate(), getClosedDays()]);
    const since = state.since ?? new Date(0);
    const range = { gte: since, lte: new Date() };

    const [counts, countLogs, expenses, purchases] = await Promise.all([
      prisma.cashCount.findMany({
        where: { periodEnd: { gt: since } },
        orderBy: { periodEnd: "asc" },
        include: { user: { select: { name: true } } },
      }),
      prisma.auditLog.findMany({
        where: { action: "CASH_COUNT", entity: "Caisse", createdAt: range },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
      }),
      prisma.expense.findMany({
        where: { date: range, NOT: ADJUSTMENT_CATEGORY_FILTER },
        orderBy: { date: "asc" },
        include: { category: { select: { name: true } } },
      }),
      prisma.investment.findMany({ where: { date: range }, orderBy: { date: "asc" } }),
    ]);

    const closureDay = await closureDays(counts);
    const days = state.since ? await dayStatuses(kinshasaDay(state.since), kinshasaToday(), closedDays) : [];
    const t = state.totals;

    return NextResponse.json({
      success: true,
      data: {
        generatedAt: new Date(),
        generatedBy: session?.user?.name ?? "",
        rate,
        base: state.lastClosure
          ? { kind: state.lastClosure.kind, label: state.lastClosure.label, at: state.lastClosure.closedAt }
          : null,
        balanceCdf: state.balance,
        breakdown: {
          openingCdf: state.openingBalance,
          salesCashCdf: n(t.totalSales),
          salesCashCount: state.cashSalesCount,
          expensesCdf: n(t.totalExpenses),
          purchasesCdf: n(t.totalPurchases),
          adjustmentsCdf: n(t.totalAdjustments ?? 0),
          handedToOwnerCdf: n(t.totalWithdrawals ?? 0),
          salesOtherCdf: n(state.otherSales.cdf),
          ownerExpensesCdf: n(state.ownerExpensesCdf),
          ownerPurchasesCdf: n(state.ownerPurchasesCdf),
        },
        closedDays,
        days,
        closures: counts.map((c) => ({
          id: c.id,
          day: closureDay.get(c.id)!,
          salesCashCdf: n(c.salesCashCdf),
          expensesCdf: n(c.expensesCdf),
          expectedCdf: n(c.expectedCdf),
          countedCdf: n(c.countedCdf),
          differenceCdf: n(c.differenceCdf),
          withdrawalCdf: n(c.withdrawalCdf),
          status: c.status,
          userName: c.user.name,
        })),
        counts: countLogs.map((l) => {
          const m = (l.metadata ?? {}) as Record<string, unknown>;
          return {
            at: l.createdAt,
            userName: l.user.name,
            usd: Number(m.usd ?? 0),
            cdf: n(m.cdf),
            rate: Number(m.rate ?? 0),
            totalCdf: n(m.totalCdf),
            differenceCdf: n(m.differenceCdf),
            notes: (m.notes as string | null) ?? null,
          };
        }),
        expenses: expenses.map((e) => ({
          date: e.date,
          category: e.category.name,
          description: e.description,
          source: SOURCE[e.source] ?? e.source,
          amountCdf: n(e.amount),
        })),
        purchases: purchases.map((p) => ({
          date: p.date,
          description: p.description ?? "",
          source: SOURCE[p.source] ?? p.source,
          amountCdf: n(p.totalAmountCdf ?? Number(p.totalAmount) * (Number(p.exchangeRate) || rate)),
        })),
      },
    });
  } catch (error) {
    console.error("[CAISSE_REPORT_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
