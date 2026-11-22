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
  getStartDate,
} from "@/lib/cash-period";
import { getOpenDayPeriod } from "@/lib/cash-count";

/**
 * What still stands in the way of a monthly closure: sales not yet covered by a day
 * closure, and day gaps still "à vérifier" in the period.
 */
async function getClosureChecks(periodStart: Date) {
  const open = await getOpenDayPeriod();
  const [unclosedSales, pendingGaps] = await Promise.all([
    prisma.sale.count({
      where: { status: "COMPLETED", createdAt: { gte: open.periodStart } },
    }),
    prisma.cashCount.count({
      where: { status: "TO_VERIFY", periodEnd: { gte: periodStart } },
    }),
  ]);
  return { unclosedSales, unclosedSince: open.periodStart, pendingGaps };
}

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
    const [totals, checks, startDate] = await Promise.all([
      getCashPeriodTotals({ gte: periodStart, lte: now }),
      getClosureChecks(periodStart),
      getStartDate(),
    ]);
    const theoreticalBalance = computeTheoreticalBalance(openingBalance, totals);

    const history = await prisma.cashMonthClosure.findMany({
      orderBy: { closedAt: "desc" },
      take: 12,
      select: {
        id: true,
        kind: true,
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
        startDate,
        checks,
        currentPeriod: {
          ...totals,
          theoreticalBalance,
        },
        history: history.map((row) => ({
          id: row.id,
          kind: row.kind,
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

/**
 * POST {kind?, closingBalanceCdf, notes?, force?}
 *  - kind "OPENING" (admin): clôture de démarrage. The counted cash becomes the opening
 *    balance and everything before now is archived. No adjustment expense is booked: the
 *    old period is set aside, not corrected.
 *  - kind "MONTH" (admin/manager): monthly closure. Refused while sales are not covered by a
 *    day closure or day gaps are still to verify, unless an admin forces it with a reason.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const role = (session.user as { role?: string }).role ?? "";
    const body = await req.json();
    const kind = body.kind === "OPENING" ? "OPENING" : "MONTH";
    const closingBalanceCdf = Math.round(Number(body.closingBalanceCdf));
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";
    const force = body.force === true;

    if (kind === "OPENING" && role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Seul un administrateur peut faire la clôture de démarrage" },
        { status: 403 }
      );
    }
    if (!["ADMIN", "MANAGER"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Seuls Admin/Manager peuvent clôturer le mois" },
        { status: 403 }
      );
    }
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

    if (kind === "MONTH") {
      const checks = await getClosureChecks(periodStart);
      const blockers: string[] = [];
      if (checks.unclosedSales > 0) {
        blockers.push(`${checks.unclosedSales} vente(s) pas encore couvertes par une clôture de la journée`);
      }
      if (checks.pendingGaps > 0) {
        blockers.push(`${checks.pendingGaps} écart(s) de caisse encore « à vérifier »`);
      }
      if (blockers.length > 0 && !(force && role === "ADMIN" && notes)) {
        return NextResponse.json(
          {
            success: false,
            error: `Clôture impossible : ${blockers.join(" et ")}. Clôturez la journée et réglez les écarts, ou forcez (admin) avec un motif.`,
            blockers,
          },
          { status: 409 }
        );
      }
    }

    const totals = await getCashPeriodTotals({ gte: periodStart, lte: periodEnd });
    const theoreticalBalance = computeTheoreticalBalance(openingBalance, totals);
    const adjustmentCdf = closingBalanceCdf - theoreticalBalance;
    const needsAdjustment = kind === "MONTH" && adjustmentCdf !== 0;
    const adjustmentCategoryId = needsAdjustment ? await ensureAdjustmentCategoryId() : null;

    const fmt = (d: Date) =>
      d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: "Africa/Kinshasa" });
    const label =
      kind === "OPENING" ? `Démarrage — ${fmt(periodEnd)}` : formatClosureLabel(periodStart, periodEnd);

    const result = await prisma.$transaction(async (tx) => {
      if (needsAdjustment && adjustmentCategoryId) {
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
            // Just before the closure, so it belongs to the period being closed.
            date: new Date(periodEnd.getTime() - 1),
          },
        });
      }

      return tx.cashMonthClosure.create({
        data: {
          kind,
          periodStart,
          periodEnd,
          closedAt: periodEnd,
          label,
          totalSalesCdf: new Prisma.Decimal(totals.totalSales),
          totalExpensesCdf: new Prisma.Decimal(totals.totalExpenses),
          totalPurchasesCdf: new Prisma.Decimal(totals.totalPurchases),
          openingBalanceCdf: new Prisma.Decimal(openingBalance),
          theoreticalBalanceCdf: new Prisma.Decimal(theoreticalBalance),
          closingBalanceCdf: new Prisma.Decimal(closingBalanceCdf),
          adjustmentCdf: new Prisma.Decimal(kind === "MONTH" ? adjustmentCdf : 0),
          notes: notes || null,
          userId: session.user!.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        kind,
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
