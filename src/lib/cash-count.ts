import { prisma } from "@/lib/prisma";
import { getStartDate } from "@/lib/cash-period";

/**
 * Day closure (Z) logic. Each closure covers everything since the previous one — the
 * previous day closure, or the start-up / monthly closure if it is more recent — up to
 * the moment it is made. A sale rung up after closing therefore goes to the next closure.
 */

/** What should be in the till for a period, in FC. */
export type CashExpectation = {
  salesCashCdf: number; // sales paid in cash: the only ones that land in the drawer
  salesOtherCdf: number; // card, mobile money...: shown for information, not in the drawer
  expensesCdf: number; // expenses paid from the till
  purchasesCdf: number; // purchases (menu Achat) paid from the till
  salesCount: number; // cash tickets
  otherCount: number; // non-cash tickets
};

export type OpenDayPeriod = {
  /** False until the start-up closure (date de démarrage) has been made. */
  ready: boolean;
  startDate: Date | null;
  periodStart: Date;
  periodEnd: Date;
  /** Cash in the till when the period opened (carried from the previous closure). */
  openingFloatCdf: number;
  floatSource: string;
};

function toNum(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const fmt = (d: Date) =>
  d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Kinshasa",
  });

/** The period the next day closure will cover, and the cash it starts from. */
export async function getOpenDayPeriod(now = new Date()): Promise<OpenDayPeriod> {
  const startDate = await getStartDate();
  const [lastCount, lastClosure] = await Promise.all([
    prisma.cashCount.findFirst({
      where: startDate ? { periodEnd: { gte: startDate } } : {},
      orderBy: { periodEnd: "desc" },
    }),
    prisma.cashMonthClosure.findFirst({ orderBy: { closedAt: "desc" } }),
  ]);

  const fromCount = lastCount
    ? {
        at: lastCount.periodEnd,
        float: toNum(lastCount.countedCdf) - toNum(lastCount.withdrawalCdf),
        source: `Clôture du ${fmt(lastCount.periodEnd)}`,
      }
    : null;
  const fromClosure = lastClosure
    ? {
        at: lastClosure.closedAt,
        float: toNum(lastClosure.closingBalanceCdf),
        source:
          lastClosure.kind === "OPENING"
            ? `Clôture de démarrage (${fmt(lastClosure.closedAt)})`
            : `Clôture du mois (${fmt(lastClosure.closedAt)})`,
      }
    : null;

  const latest =
    fromCount && fromClosure
      ? fromCount.at >= fromClosure.at
        ? fromCount
        : fromClosure
      : fromCount ?? fromClosure;

  return {
    ready: startDate !== null,
    startDate,
    periodStart: latest?.at ?? new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    periodEnd: now,
    openingFloatCdf: latest ? Math.round(latest.float) : 0,
    floatSource: latest?.source ?? "Aucune clôture précédente",
  };
}

/** Cash movements in [gte, lt). */
export async function getCashExpectation(gte: Date, lt: Date): Promise<CashExpectation> {
  const range = { gte, lt };
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
    otherCount: other._count,
  };
}

/** Expected cash = starting float + cash sales − till expenses − till purchases. */
export function expectedCash(e: CashExpectation, openingFloatCdf: number): number {
  return openingFloatCdf + e.salesCashCdf - e.expensesCdf - e.purchasesCdf;
}

/**
 * Everything dated before this instant is closed: covered by a day closure, or archived
 * (before the start date). Null when nothing is closed yet.
 */
export async function getLockedUntil(): Promise<Date | null> {
  const startDate = await getStartDate();
  const lastCount = await prisma.cashCount.findFirst({
    where: startDate ? { periodEnd: { gte: startDate } } : {},
    orderBy: { periodEnd: "desc" },
    select: { periodEnd: true },
  });
  const candidates = [startDate, lastCount?.periodEnd ?? null].filter((d): d is Date => d !== null);
  if (candidates.length === 0) return null;
  return new Date(Math.max(...candidates.map((d) => d.getTime())));
}

/**
 * Refusal message when a non-admin touches money in a closed day, or null when allowed.
 * Admins may still correct a closed day; callers log it.
 */
export async function closedDayRefusal(date: Date, role: string | undefined): Promise<string | null> {
  if (role === "ADMIN") return null;
  const lockedUntil = await getLockedUntil();
  if (lockedUntil && date < lockedUntil) {
    return "Cette journée est clôturée : seul un administrateur peut encore la modifier.";
  }
  return null;
}

/** Finds or creates an active expense category by name (case-insensitive). */
export async function ensureExpenseCategory(name: string, description: string): Promise<string> {
  const existing = await prisma.expenseCategory.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    if (!existing.active) {
      await prisma.expenseCategory.update({ where: { id: existing.id }, data: { active: true } });
    }
    return existing.id;
  }
  const created = await prisma.expenseCategory.create({ data: { name, description, active: true } });
  return created.id;
}

export const CASH_GAP_CATEGORY = "Écart de caisse";

// ------------------------------------------------------------------ business day

const KINSHASA_MS = 3600_000; // UTC+1, no daylight saving
const DAY_CUTOFF_MS = 12 * 3600_000;

/**
 * The day a closure accounts for, as YYYY-MM-DD (Kinshasa). The till is counted and the
 * money handed over in the morning, so a closure made before noon closes the previous
 * day; one made in the afternoon or evening closes that same day.
 */
export function businessDay(periodEnd: Date): string {
  return new Date(periodEnd.getTime() + KINSHASA_MS - DAY_CUTOFF_MS).toISOString().slice(0, 10);
}

/** periodEnd range of the closures whose business day falls in month `m` (1-12) of `y`. */
export function businessMonthRange(y: number, m: number): { gte: Date; lt: Date } {
  return {
    gte: new Date(Date.UTC(y, m - 1, 1) - KINSHASA_MS + DAY_CUTOFF_MS),
    lt: new Date(Date.UTC(y, m, 1) - KINSHASA_MS + DAY_CUTOFF_MS),
  };
}

export const CASH_COUNT_STATUSES = ["BALANCED", "TO_VERIFY", "LOSS", "JUSTIFIED"] as const;
export type CashCountStatusValue = (typeof CASH_COUNT_STATUSES)[number];
