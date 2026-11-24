import { prisma } from "@/lib/prisma";
import {
  ADJUSTMENT_CATEGORY_FILTER,
  computeTheoreticalBalance,
  getCashPeriodTotals,
  getLastCashClosure,
  getOpeningBalance,
} from "@/lib/cash-period";

const DEFAULT_RATE = 2850;

export async function activeRate(): Promise<number> {
  const row = await prisma.exchangeRate.findFirst({
    where: { active: true },
    orderBy: { effectiveDate: "desc" },
    select: { rateUsdToCdf: true },
  });
  const rate = Number(row?.rateUsdToCdf ?? DEFAULT_RATE);
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_RATE;
}

/** The Caisse balance since the last start-up / month closure, and what it is made of. */
export async function caisseState() {
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

