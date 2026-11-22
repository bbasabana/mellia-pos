/**
 * Dates picked in a form (YYYY-MM-DD) for money going out (purchases, expenses).
 *
 * Stored as UTC midnight they would land at 01:00 Kinshasa, before the morning day closure:
 * the entry would fall into an already closed day (refused for non-admins, missing from the
 * till). So a day picked in a form becomes a real moment in that day.
 */

const KINSHASA_MS = 3600_000; // Kinshasa is UTC+1 all year

/** Today's date in Kinshasa, as YYYY-MM-DD. */
export function kinshasaToday(now = new Date()): string {
    return kinshasaDate(now);
}

/** The Kinshasa calendar date of a moment, as YYYY-MM-DD. */
export function kinshasaDate(d: Date): string {
    return new Date(d.getTime() + KINSHASA_MS).toISOString().slice(0, 10);
}

/** Midnight in Kinshasa for a Kinshasa date (YYYY-MM-DD). */
export function kinshasaMidnight(day: string): Date {
    return new Date(Date.parse(`${day}T00:00:00Z`) - KINSHASA_MS);
}

/**
 * The moment stored for a form date:
 * - same day as the entry being edited → the entry keeps its moment;
 * - today → now (lands in the open day, after the morning closure);
 * - another day → noon in Kinshasa that day;
 * - a full ISO date-time → used as is.
 */
export function resolveEntryDate(input: unknown, previous?: Date | null, now = new Date()): Date {
    if (typeof input !== "string" || input.trim() === "") return previous ?? now;
    const value = input.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? previous ?? now : d;
    }
    if (previous && kinshasaDate(previous) === value) return previous;
    if (value === kinshasaToday(now)) return now;
    return new Date(Date.parse(`${value}T12:00:00Z`) - KINSHASA_MS);
}

/** Start of a reporting period in Kinshasa time: day, week (Monday), month, year; null for all. */
export function kinshasaPeriodStart(period: string, now = new Date()): Date | null {
    const today = kinshasaToday(now);
    const [y, m] = today.split("-").map(Number);
    switch (period) {
        case "day":
            return kinshasaMidnight(today);
        case "week": {
            const local = new Date(`${today}T00:00:00Z`);
            const back = (local.getUTCDay() + 6) % 7; // days since Monday
            return new Date(kinshasaMidnight(today).getTime() - back * 86_400_000);
        }
        case "month":
            return kinshasaMidnight(`${y}-${String(m).padStart(2, "0")}-01`);
        case "year":
            return kinshasaMidnight(`${y}-01-01`);
        default:
            return null;
    }
}
