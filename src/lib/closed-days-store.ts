import { prisma } from "@/lib/prisma";
import { NO_CLOSED_DAYS, sanitizeClosedDays, type ClosedDays } from "@/lib/closed-days";

/**
 * The closed days are kept as a history of settings in the audit log (action "SETTINGS",
 * entity "ClosedDays"): the latest row is the current setting, older rows say who changed
 * what and when. No table of its own, so no database migration.
 */
export const CLOSED_DAYS_ENTITY = "ClosedDays";

export async function getClosedDays(): Promise<ClosedDays & { updatedAt: Date | null; updatedBy: string | null }> {
  const row = await prisma.auditLog.findFirst({
    where: { action: "SETTINGS", entity: CLOSED_DAYS_ENTITY },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
  if (!row) return { ...NO_CLOSED_DAYS, updatedAt: null, updatedBy: null };
  return { ...sanitizeClosedDays(row.metadata), updatedAt: row.createdAt, updatedBy: row.user.name };
}
