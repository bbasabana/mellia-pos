import { prisma } from "@/lib/prisma";

/** What should be in the till for a period, in FC. */
export type CashExpectation = {
  salesCashCdf: number; // sales paid in cash: the only ones that land in the drawer
  salesOtherCdf: number; // card, mobile money...: shown for information, not in the drawer
  expensesCdf: number; // expenses paid from the till
  purchasesCdf: number; // purchases (menu Achat) paid from the till
  salesCount: number; // cash tickets
};

function toNum(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function getCashExpectation(gte: Date, lte: Date): Promise<CashExpectation> {
  const range = { gte, lte };
  const [cash, other, expenses, purchases] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: range, status: "COMPLETED", paymentMethod: "CASH" },
      _sum: { totalCdf: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { createdAt: range, status: "COMPLETED", paymentMethod: { not: "CASH" } },
      _sum: { totalCdf: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { date: range, source: "CASH_REGISTER" },
      _sum: { amount: true },
    }),
    prisma.investment.aggregate({
      where: { date: range, source: "CASH_REGISTER" },
      _sum: { totalAmountCdf: true },
    }),
  ]);

  return {
    salesCashCdf: Math.round(toNum(cash._sum.totalCdf)),
    salesOtherCdf: Math.round(toNum(other._sum.totalCdf)),
    expensesCdf: Math.round(toNum(expenses._sum.amount)),
    purchasesCdf: Math.round(toNum(purchases._sum.totalAmountCdf)),
    salesCount: cash._count,
  };
}

/** Expected cash = starting float + cash sales − till expenses − till purchases. */
export function expectedCash(e: CashExpectation, openingFloatCdf: number): number {
  return openingFloatCdf + e.salesCashCdf - e.expensesCdf - e.purchasesCdf;
}

/** Day bounds sent by the browser (its local day), checked so nobody counts a whole year. */
export function parseCountRange(from: unknown, to: unknown): { gte: Date; lte: Date } | null {
  const gte = new Date(String(from ?? ""));
  const lte = new Date(String(to ?? ""));
  if (Number.isNaN(gte.getTime()) || Number.isNaN(lte.getTime())) return null;
  const span = lte.getTime() - gte.getTime();
  if (span <= 0 || span > 2 * 24 * 3600 * 1000) return null;
  return { gte, lte };
}

export const CASH_COUNT_STATUSES = ["BALANCED", "TO_VERIFY", "LOSS", "JUSTIFIED"] as const;
export type CashCountStatusValue = (typeof CASH_COUNT_STATUSES)[number];
