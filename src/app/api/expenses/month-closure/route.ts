import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  computeTheoreticalBalance,
  ensureAdjustmentCategoryId,
  formatClosureLabel,
  getCashPeriodTotals,
  getLastCashClosure,
  getOpeningBalance,
  getOpenPeriodStart,
} from "@/lib/cash-period";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const lastClosure = await getLastCashClosure();
    const openPeriodStart = getOpenPeriodStart(lastClosure);
    const openingBalance = getOpeningBalance(lastClosure);
    const now = new Date();

    const periodStart = openPeriodStart ?? new Date(0);
    const totals = await getCashPeriodTotals({ gte: periodStart, lte: now });
    const theoreticalBalance = computeTheoreticalBalance(openingBalance, totals);

    const history = await prisma.cashMonthClosure.findMany({
      orderBy: { closedAt: "desc" },
      take: 12,
      select: {
        id: true,
        closedAt: true,
        label: true,
        totalSalesCdf: true,
        totalExpensesCdf: true,
        totalPurchasesCdf: true,
        openingBalanceCdf: true,
        closingBalanceCdf: true,
        theoreticalBalanceCdf: true,
        adjustmentCdf: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        lastClosure,
        openPeriodStart,
        openingBalance,
        currentPeriod: {
          ...totals,
          theoreticalBalance,
        },
        history: history.map((row) => ({
          id: row.id,
          closedAt: row.closedAt,
          label: row.label,
          totalSalesCdf: Number(row.totalSalesCdf),
          totalExpensesCdf: Number(row.totalExpensesCdf),
          totalPurchasesCdf: Number(row.totalPurchasesCdf),
          openingBalanceCdf: Number(row.openingBalanceCdf),
          closingBalanceCdf: Number(row.closingBalanceCdf),
          theoreticalBalanceCdf: Number(row.theoreticalBalanceCdf),
          adjustmentCdf: Number(row.adjustmentCdf),
        })),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[MONTH_CLOSURE_GET]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (!["ADMIN", "MANAGER"].includes(role || "")) {
      return NextResponse.json(
        { success: false, error: "Seuls Admin/Manager peuvent clôturer le mois" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const closingBalanceCdf = Number(body.closingBalanceCdf);
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (!Number.isFinite(closingBalanceCdf) || closingBalanceCdf < 0) {
      return NextResponse.json(
        { success: false, error: "Montant de clôture invalide" },
        { status: 400 }
      );
    }

    const lastClosure = await getLastCashClosure();
    const openingBalance = getOpeningBalance(lastClosure);
    const openPeriodStart = getOpenPeriodStart(lastClosure);
    const periodStart = openPeriodStart ?? new Date(0);
    const periodEnd = new Date();

    const totals = await getCashPeriodTotals({ gte: periodStart, lte: periodEnd });
    const theoreticalBalance = computeTheoreticalBalance(openingBalance, totals);
    const adjustmentCdf = closingBalanceCdf - theoreticalBalance;
    const adjustmentCategoryId = adjustmentCdf !== 0 ? await ensureAdjustmentCategoryId() : null;

    const result = await prisma.$transaction(async (tx) => {
      if (adjustmentCdf !== 0 && adjustmentCategoryId) {
        await tx.expense.create({
          data: {
            description:
              adjustmentCdf > 0
                ? "Ajustement clôture (Surplus constaté)"
                : "Ajustement clôture (Manquant constaté)",
            amount: new Prisma.Decimal(-adjustmentCdf),
            categoryId: adjustmentCategoryId,
            source: "CASH_REGISTER",
            userId: session.user!.id,
            date: periodEnd,
          },
        });
      }

      const closure = await tx.cashMonthClosure.create({
        data: {
          periodStart,
          periodEnd,
          label: formatClosureLabel(periodStart, periodEnd),
          totalSalesCdf: new Prisma.Decimal(totals.totalSales),
          totalExpensesCdf: new Prisma.Decimal(totals.totalExpenses),
          totalPurchasesCdf: new Prisma.Decimal(totals.totalPurchases),
          openingBalanceCdf: new Prisma.Decimal(openingBalance),
          theoreticalBalanceCdf: new Prisma.Decimal(theoreticalBalance),
          closingBalanceCdf: new Prisma.Decimal(closingBalanceCdf),
          adjustmentCdf: new Prisma.Decimal(adjustmentCdf),
          notes: notes || null,
          userId: session.user!.id,
        },
      });

      return closure;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        label: result.label,
        closingBalanceCdf,
        totalSalesCdf: totals.totalSales,
        openingBalanceForNextPeriod: closingBalanceCdf,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[MONTH_CLOSURE_POST]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
