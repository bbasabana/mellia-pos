/**
 * Days the restaurant is closed: every week on some weekdays (e.g. Tuesday) and on given
 * dates (public holidays). Shared by the server and the browser: no database here.
 */

export type ClosedDays = {
  /** 0 = Sunday … 6 = Saturday. */
  weekdays: number[];
  /** YYYY-MM-DD with an optional label ("Noël"). */
  dates: Array<{ date: string; label: string }>;
};

export const NO_CLOSED_DAYS: ClosedDays = { weekdays: [], dates: [] };

export const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** Weekday (0 = Sunday) of a calendar day YYYY-MM-DD. */
export function weekdayOf(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

/** Why the restaurant is closed that day ("Fermé le mardi", "Noël"), or null when open. */
export function closedReason(day: string, cfg: ClosedDays): string | null {
  const holiday = cfg.dates.find((d) => d.date === day);
  if (holiday) return holiday.label || "Jour férié";
  const wd = weekdayOf(day);
  if (cfg.weekdays.includes(wd)) return `Fermé le ${WEEKDAYS[wd]}`;
  return null;
}

/** Today in Kinshasa (UTC+1), YYYY-MM-DD. */
export function kinshasaToday(now = new Date()): string {
  return new Date(now.getTime() + 3600_000).toISOString().slice(0, 10);
}

/** Cleans what the browser sends: known weekdays, valid dates, short labels, sorted. */
export function sanitizeClosedDays(input: unknown): ClosedDays {
  const raw = (input ?? {}) as { weekdays?: unknown; dates?: unknown };
  const weekdays = Array.isArray(raw.weekdays)
    ? [...new Set(raw.weekdays.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))].sort()
    : [];
  const seen = new Set<string>();
  const dates = (Array.isArray(raw.dates) ? raw.dates : [])
    .map((d) => d as { date?: unknown; label?: unknown })
    .filter((d) => typeof d.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.date) && !Number.isNaN(Date.parse(d.date)))
    .map((d) => ({ date: d.date as string, label: typeof d.label === "string" ? d.label.trim().slice(0, 60) : "" }))
    .filter((d) => (seen.has(d.date) ? false : (seen.add(d.date), true)))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 100);
  return { weekdays, dates };
}
