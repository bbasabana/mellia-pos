import { prisma } from "@/lib/prisma";

export type CashPeriodRange = {
  gte: Date;
  lte: Date;
};

export type CashPeriodTotals = {
  totalSales: number;
  totalExpenses: number;
  totalPurchases: number;
  /** Cash handed to the owner at day closures ("versements"); optional for older callers. */
  totalWithdrawals?: number;
};

export type LastCashClosure = {
  id: string;
  kind: "MONTH" | "OPENING";
  closedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  label: string;
  totalSalesCdf: number;
  totalExpensesCdf: number;
  totalPurchasesCdf: number;
  openingBalanceCdf: number;
  theoreticalBalanceCdf: number;
  closingBalanceCdf: number;
  adjustmentCdf: number;
  notes: string | null;
};

function toNum(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function getLastCashClosure(): Promise<LastCashClosure | null> {
  const row = await prisma.cashMonthClosure.findFirst({
    orderBy: { closedAt: "desc" },
  });

  if (!row) return null;

  return {
    id: row.id,
    kind: row.kind,
    closedAt: row.closedAt,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    label: row.label,
    totalSalesCdf: toNum(row.totalSalesCdf),
    totalExpensesCdf: toNum(row.totalExpensesCdf),
    totalPurchasesCdf: toNum(row.totalPurchasesCdf),
    openingBalanceCdf: toNum(row.openingBalanceCdf),
    theoreticalBalanceCdf: toNum(row.theoreticalBalanceCdf),
    closingBalanceCdf: toNum(row.closingBalanceCdf),
    adjustmentCdf: toNum(row.adjustmentCdf),
    notes: row.notes,
  };
}

export function getOpenPeriodStart(lastClosure: LastCashClosure | null): Date | null {
  return lastClosure?.closedAt ?? null;
}

export function getOpeningBalance(lastClosure: LastCashClosure | null): number {
  return lastClosure?.closingBalanceCdf ?? 0;
}

export function resolveSummaryDateRange(
  period: string,
  openPeriodStart: Date | null
): { gte?: Date; lte?: Date } {
  const now = new Date();
  let gte: Date | undefined;
  let lte: Date | undefined = now;

  if (period === "all") {
    return {};
  }

  if (period === "current") {
    gte = openPeriodStart ?? undefined;
    return { gte, lte };
  }

  if (period === "today") {
    gte = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "week") {
    gte = new Date(now);
    gte.setDate(now.getDate() - 7);
  } else if (period === "month") {
    gte = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "year") {
    gte = new Date(now.getFullYear(), 0, 1);
  }

  if (gte && openPeriodStart && openPeriodStart > gte) {
    gte = openPeriodStart;
  }

  return { gte, lte };
}

export function resolveTransactionsDateRange(
  period: string | null | undefined,
  startDate: string | null | undefined,
  endDate: string | null | undefined
): { gte: Date; lte: Date } | null {
  const now = new Date();

  if (period && period !== "all") {
    let start: Date;
    if (period === "day") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "3days") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
      start.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diff);
      start.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "year") {
      start = new Date(now.getFullYear(), 0, 1);
    } else {
      start = new Date(0);
    }
    return { gte: start, lte: now };
  }

  if (startDate && endDate) {
    return {
      gte: new Date(startDate),
      lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
    };
  }

  if (startDate) {
    return { gte: new Date(startDate), lte: now };
  }

  return null;
}

export async function getCashPeriodTotals(range: CashPeriodRange): Promise<CashPeriodTotals> {
  const dateFilter = { gte: range.gte, lte: range.lte };

  const [sales, expenses, purchases, withdrawals] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        createdAt: dateFilter,
        status: "COMPLETED",
        // Only cash lands in the till; card / mobile money go straight to the bank or wallet.
        paymentMethod: "CASH",
      },
      _sum: { totalCdf: true },
    }),
    prisma.expense.aggregate({
      where: {
        date: dateFilter,
        source: "CASH_REGISTER",
      },
      _sum: { amount: true },
    }),
    prisma.investment.aggregate({
      where: {
        date: dateFilter,
        source: "CASH_REGISTER",
      },
      _sum: { totalAmountCdf: true },
    }),
    prisma.cashCount.aggregate({
      where: { periodEnd: dateFilter },
      _sum: { withdrawalCdf: true },
    }),
  ]);

  return {
    totalSales: toNum(sales._sum.totalCdf),
    totalExpenses: toNum(expenses._sum.amount),
    totalPurchases: toNum(purchases._sum.totalAmountCdf),
    totalWithdrawals: toNum(withdrawals._sum.withdrawalCdf),
  };
}

export function computeTheoreticalBalance(
  openingBalance: number,
  totals: CashPeriodTotals
): number {
  return (
    openingBalance +
    totals.totalSales -
    totals.totalExpenses -
    totals.totalPurchases -
    (totals.totalWithdrawals ?? 0)
  );
}

export function formatClosureLabel(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  return `Période ${fmt(start)} → ${fmt(end)}`;
}

export async function ensureAdjustmentCategoryId(): Promise<string> {
  let category = await prisma.expenseCategory.findFirst({
    where: {
      active: true,
      name: { contains: "ajustement", mode: "insensitive" },
    },
  });

  if (!category) {
    category = await prisma.expenseCategory.create({
      data: {
        name: "Ajustement de Caisse",
        description: "Corrections de solde et clôtures",
        active: true,
      },
    });
  }

  return category.id;
}

// ------------------------------------------------------------------ start date & archives

/**
 * Date de démarrage: the latest start-up (OPENING) closure. Everything before it is archived:
 * kept, readable, but out of every total. Null until the start-up closure is done.
 */
export async function getStartDate(): Promise<Date | null> {
  const row = await prisma.cashMonthClosure.findFirst({
    where: { kind: "OPENING" },
    orderBy: { closedAt: "desc" },
    select: { closedAt: true },
  });
  return row?.closedAt ?? null;
}

/**
 * Restricts a Prisma `where` to the current era (on/after the start date) or, with
 * `archives`, to what came before it. Without a start date nothing is archived yet.
 */
export function withEra<W extends Record<string, unknown>>(
  where: W,
  field: string,
  startDate: Date | null,
  archives: boolean
): W {
  if (!startDate) return archives ? ({ AND: [where, { [field]: { lt: new Date(0) } }] } as unknown as W) : where;
  const era = archives ? { [field]: { lt: startDate } } : { [field]: { gte: startDate } };
  return { AND: [where, era] } as unknown as W;
}
