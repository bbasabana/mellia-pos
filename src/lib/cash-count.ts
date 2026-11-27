import { prisma } from "@/lib/prisma";
import { ADJUSTMENT_CATEGORY_FILTER, getStartDate } from "@/lib/cash-period";

/**
 * Day closure (Z) logic. Each closure covers everything since the previous one — the
 * previous day closure, or the start-up / monthly closure if it is more recent — up to
 * the moment it is made. A sale rung up after closing therefore goes to the next closure.
 *
 * The day closure checks the day's takings only: its cash sales − the expenses paid from the
 * drawer that day. Nothing is carried over from earlier days. Purchases are not in it: they are
 * paid beforehand from the Caisse (the starting money the owner holds), and are taken off
 * the Caisse balance instead (menu Caisse).
 */

/** What should be in the till for a period, in FC. */
export type CashExpectation = {
  salesCashCdf: number; // sales paid in cash: the only ones that land in the drawer
  salesOtherCdf: number; // card, mobile money...: shown for information, not in the drawer
  expensesCdf: number; // expenses paid from the till
  /** Always 0 now: purchases come out of the Caisse, not out of the day's takings. */
  purchasesCdf: number;
  salesCount: number; // cash tickets
  otherCount: number; // non-cash tickets
};

export type OpenDayPeriod = {
  /** False until the start-up closure (date de démarrage) has been made. */
  ready: boolean;
  startDate: Date | null;
  periodStart: Date;
  periodEnd: Date;
  /** Cash left in the drawer when the period opened (from the previous day closure). */
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

  // Each day is closed on its own money: its cash sales minus its drawer expenses. What
  // earlier days left is not carried over (the running total is in the menu Caisse).
  const drawerFloat = 0;

  const fromCount = lastCount
    ? { at: lastCount.periodEnd, source: `Reste de la clôture du ${fmt(lastCount.periodEnd)}` }
    : null;
  const fromClosure = lastClosure
    ? {
        at: lastClosure.closedAt,
        source:
          lastClosure.kind === "OPENING"
            ? `Depuis le démarrage (${fmt(lastClosure.closedAt)})`
            : `Depuis la clôture du mois (${fmt(lastClosure.closedAt)})`,
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
    openingFloatCdf: drawerFloat,
    floatSource: latest?.source ?? "Aucune clôture précédente",
  };
}

/** A day with sales not yet covered by a day closure. */
export type PendingDay = { day: string; salesCount: number; salesCashCdf: number };

/** End of business day `day` (YYYY-MM-DD): 06:00 Kinshasa the next morning (see saleDay). */
export function businessDayEnd(day: string): Date {
  return new Date(Date.parse(`${day}T06:00:00+01:00`) + 86400_000);
}

/**
 * The period the next day closure covers: one day at a time. When several days of sales
 * are still open (e.g. Wednesday and Thursday), the closure stops at the end of the oldest
 * one, so each day is closed with its own money; the next closure then takes the next day.
 * `pendingDays` lists every open day, oldest first.
 */
export async function getClosingPeriod(
  now = new Date()
): Promise<OpenDayPeriod & { pendingDays: PendingDay[] }> {
  const open = await getOpenDayPeriod(now);
  const sales = await prisma.sale.findMany({
    where: { status: "COMPLETED", createdAt: { gte: open.periodStart, lt: open.periodEnd } },
    select: { createdAt: true, totalCdf: true, paymentMethod: true },
  });
  const byDay = new Map<string, PendingDay>();
  for (const s of sales) {
    const day = saleDay(s.createdAt);
    const row = byDay.get(day) ?? { day, salesCount: 0, salesCashCdf: 0 };
    row.salesCount += 1;
    if (s.paymentMethod === "CASH") row.salesCashCdf += Math.round(toNum(s.totalCdf));
    byDay.set(day, row);
  }
  const pendingDays = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
  const first = pendingDays[0];
  const end = first ? businessDayEnd(first.day) : null;
  return {
    ...open,
    periodEnd: end && end < open.periodEnd ? end : open.periodEnd,
    pendingDays,
  };
}

/** Cash movements in [gte, lt). */
export async function getCashExpectation(gte: Date, lt: Date): Promise<CashExpectation> {
  const range = { gte, lt };
  const [cash, other, expenses] = await Promise.all([
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
    // Count corrections of the Caisse are not drawer money.
    prisma.expense.aggregate({
      where: { date: range, source: "CASH_REGISTER", NOT: ADJUSTMENT_CATEGORY_FILTER },
      _sum: { amount: true },
    }),
  ]);

  return {
    salesCashCdf: Math.round(toNum(cash._sum.totalCdf)),
    salesOtherCdf: Math.round(toNum(other._sum.totalCdf)),
    expensesCdf: Math.round(toNum(expenses._sum.amount)),
    purchasesCdf: 0,
    salesCount: cash._count,
    otherCount: other._count,
  };
}

/** Expected cash in the drawer = what was left in it + cash sales − expenses paid from it. */
export function expectedCash(e: CashExpectation, openingFloatCdf: number): number {
  return openingFloatCdf + e.salesCashCdf - e.expensesCdf;
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

const NIGHT_MS = 6 * 3600_000;

/** YYYY-MM-DD (Kinshasa) of a sale; one rung up before 06:00 belongs to the evening before. */
export function saleDay(at: Date): string {
  return new Date(at.getTime() + KINSHASA_MS - NIGHT_MS).toISOString().slice(0, 10);
}

/**
 * The day each closure accounts for: the day of its last sale, whatever the hour the till
 * is counted (the sales of Monday stay Monday's even if the closure is made Tuesday
 * afternoon). A period without any sale falls back on the closing time (`businessDay`).
 */
export async function closureDays(
  rows: Array<{ id: string; periodStart: Date; periodEnd: Date }>
): Promise<Map<string, string>> {
  const days = new Map<string, string>();
  if (rows.length === 0) return days;
  const from = new Date(Math.min(...rows.map((r) => r.periodStart.getTime())));
  const to = new Date(Math.max(...rows.map((r) => r.periodEnd.getTime())));
  const sales = await prisma.sale.findMany({
    where: { status: "COMPLETED", createdAt: { gte: from, lt: to } },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  for (const r of rows) {
    const last = sales.find((s) => s.createdAt >= r.periodStart && s.createdAt < r.periodEnd);
    days.set(r.id, last ? saleDay(last.createdAt) : businessDay(r.periodEnd));
  }
  return days;
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
