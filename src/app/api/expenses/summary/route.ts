import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  computeTheoreticalBalance,
  getCashPeriodTotals,
  getLastCashClosure,
  getOpeningBalance,
  getOpenPeriodStart,
  resolveSummaryDateRange,
  getStartDate,
} from "@/lib/cash-period";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "current";

    const lastClosure = await getLastCashClosure();
    const openPeriodStart = getOpenPeriodStart(lastClosure);
    const openingBalance = getOpeningBalance(lastClosure);
    const { gte, lte } = resolveSummaryDateRange(period, openPeriodStart);

    const dateFilter = gte && lte ? { gte, lte } : undefined;

    // Nothing before the start date (date de démarrage) counts: it is archived.
    const startDate = await getStartDate();
    const floor = (d: Date) => (startDate && d < startDate ? startDate : d);
    const rawRange =
      dateFilter ??
      (period === "current" || period === "all"
        ? { gte: new Date(0), lte: new Date() }
        : null);
    const displayRange = rawRange ? { gte: floor(rawRange.gte), lte: rawRange.lte } : null;

    const [displayTotals, expensesBossAgg] = await Promise.all([
      displayRange
        ? getCashPeriodTotals({ gte: displayRange.gte, lte: displayRange.lte })
        : Promise.resolve({ totalSales: 0, totalExpenses: 0, totalPurchases: 0, totalWithdrawals: 0 }),
      prisma.expense.aggregate({
        where: {
          date: displayRange ?? { gte: floor(new Date(0)) },
          source: "OWNER_CAPITAL",
        },
        _sum: { amount: true },
      }),
    ]);

    let totalSales = displayTotals.totalSales;
    let totalExpenses = displayTotals.totalExpenses;
    let totalPurchases = displayTotals.totalPurchases;
    const totalWithdrawals = displayTotals.totalWithdrawals ?? 0;

    const balanceRangeStart = openPeriodStart ?? new Date(0);
    const openTotals = await getCashPeriodTotals({
      gte: balanceRangeStart,
      lte: new Date(),
    });
    const balance = computeTheoreticalBalance(openingBalance, openTotals);

    const totalExpensesBoss = Number(expensesBossAgg._sum.amount || 0);

    return NextResponse.json({
      success: true,
      data: {
        totalSales,
        totalExpenses,
        totalPurchases,
        totalWithdrawals,
        balance,
        startDate: startDate?.toISOString() ?? null,
        totalExpensesBoss,
        period,
        openingBalance,
        openPeriodStart: openPeriodStart?.toISOString() ?? null,
        lastClosure: lastClosure
          ? {
              label: lastClosure.label,
              kind: lastClosure.kind,
              closedAt: lastClosure.closedAt.toISOString(),
              totalSalesCdf: lastClosure.totalSalesCdf,
              closingBalanceCdf: lastClosure.closingBalanceCdf,
            }
          : null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("❌ [API] Expenses Summary Error CRITICAL:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        details: message,
      },
      { status: 500 }
    );
  }
}
