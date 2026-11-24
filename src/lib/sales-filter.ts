import { Prisma } from "@prisma/client";

/**
 * createdAt filter of the sales history: a period button (day, 3days, week, month, year,
 * all) or a date range. Shared by the list and its PDF export so both show the same sales.
 */
export function salesDateFilter(
    period: string | null,
    startDate: string | null,
    endDate: string | null
): Prisma.DateTimeFilter | undefined {
    if (period && period !== "all") {
        const now = new Date();
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
        return { gte: start };
    }
    if (startDate && endDate) {
        // A full timestamp (the mobile app sends the local day bounds) is taken as is;
        // a bare date covers that whole day.
        return {
            gte: new Date(startDate),
            lte: endDate.includes("T") ? new Date(endDate) : new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        };
    }
    if (startDate) return { gte: new Date(startDate) };
    return undefined;
}
