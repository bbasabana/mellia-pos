import { prisma } from "@/lib/prisma";
import { closureDays, saleDay } from "@/lib/cash-count";
import { closedReason, kinshasaToday, type ClosedDays } from "@/lib/closed-days";

/**
 * What happened on each day of a range: sales, day closures, and whether the restaurant
 * was open. A day the restaurant is closed (every Tuesday, a holiday) is not expected to
 * have sales nor a closure; a working day with sales must be closed.
 */
export type DayStatusKind =
  | "CLOSED_OK" // a day closure accounts for it
  | "CLOSED_DAY" // restaurant closed, nothing to do
  | "CLOSED_DAY_SALES" // restaurant closed but sales were rung up
  | "TO_CLOSE" // sales without a day closure yet
  | "NO_SALES" // open day without any sale
  | "TODAY";

export type DayStatus = {
  day: string;
  closedReason: string | null;
  salesCount: number;
  salesCashCdf: number;
  closureIds: string[];
  status: DayStatusKind;
};

const KINSHASA = "+01:00";
const nextDay = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) + 86400_000).toISOString().slice(0, 10);

/** Calendar days from `fromDay` to `toDay` (YYYY-MM-DD, both included). */
export function daysBetween(fromDay: string, toDay: string): string[] {
  const out: string[] = [];
  for (let d = fromDay; d <= toDay && out.length < 400; d = nextDay(d)) out.push(d);
  return out;
}

export async function dayStatuses(fromDay: string, toDay: string, cfg: ClosedDays): Promise<DayStatus[]> {
  if (fromDay > toDay) return [];
  // A sale rung up before 06:00 belongs to the evening before (see saleDay).
  const gte = new Date(`${fromDay}T06:00:00${KINSHASA}`);
  const lt = new Date(`${nextDay(toDay)}T06:00:00${KINSHASA}`);

  const [sales, counts] = await Promise.all([
    prisma.sale.findMany({
      where: { status: "COMPLETED", createdAt: { gte, lt } },
      select: { createdAt: true, totalCdf: true, paymentMethod: true },
    }),
    prisma.cashCount.findMany({
      where: { periodEnd: { gte: new Date(gte.getTime() - 86400_000), lt: new Date(lt.getTime() + 3 * 86400_000) } },
      select: { id: true, periodStart: true, periodEnd: true },
    }),
  ]);

  const byDay = new Map<string, { count: number; cash: number }>();
  for (const s of sales) {
    const d = saleDay(s.createdAt);
    const row = byDay.get(d) ?? { count: 0, cash: 0 };
    row.count += 1;
    if (s.paymentMethod === "CASH") row.cash += Math.round(Number(s.totalCdf));
    byDay.set(d, row);
  }
  const closures = new Map<string, string[]>();
  for (const [id, d] of await closureDays(counts)) closures.set(d, [...(closures.get(d) ?? []), id]);

  const today = kinshasaToday();
  return daysBetween(fromDay, toDay).map((day) => {
    const s = byDay.get(day) ?? { count: 0, cash: 0 };
    const reason = closedReason(day, cfg);
    const ids = closures.get(day) ?? [];
    let status: DayStatusKind;
    if (ids.length > 0) status = "CLOSED_OK";
    else if (reason) status = s.count > 0 ? "CLOSED_DAY_SALES" : "CLOSED_DAY";
    else if (day === today) status = "TODAY";
    else status = s.count > 0 ? "TO_CLOSE" : "NO_SALES";
    return { day, closedReason: reason, salesCount: s.count, salesCashCdf: s.cash, closureIds: ids, status };
  });
}

/** Kinshasa calendar day of an instant. */
export function kinshasaDay(at: Date): string {
  return new Date(at.getTime() + 3600_000).toISOString().slice(0, 10);
}
