import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import {
  businessDay,
  businessMonthRange,
  CASH_GAP_CATEGORY,
  ensureExpenseCategory,
  expectedCash,
  getCashExpectation,
  getOpenDayPeriod,
} from "@/lib/cash-count";

type SessionUser = { id?: string; name?: string | null; role?: string };

const MANAGERS = ["ADMIN", "MANAGER"];

const include = { user: { select: { name: true } } } as const;
type Row = Prisma.CashCountGetPayload<{ include: typeof include }>;

function serialize(row: Row) {
  return {
    id: row.id,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    businessDay: businessDay(row.periodEnd),
    salesCashCdf: Number(row.salesCashCdf),
    salesOtherCdf: Number(row.salesOtherCdf),
    expensesCdf: Number(row.expensesCdf),
    purchasesCdf: Number(row.purchasesCdf),
    openingFloatCdf: Number(row.openingFloatCdf),
    expectedCdf: Number(row.expectedCdf),
    countedCdf: Number(row.countedCdf),
    differenceCdf: Number(row.differenceCdf),
    withdrawalCdf: Number(row.withdrawalCdf),
    status: row.status,
    notes: row.notes,
    resolutionNote: row.resolutionNote,
    resolvedByName: row.resolvedByName,
    resolvedAt: row.resolvedAt,
    settlementCategory: row.settlementCategory,
    createdAt: row.createdAt,
    userName: row.user.name,
  };
}

/**
 * GET: the open day (what the till should hold since the last closure), the latest
 * closures, and what managers still have to settle. `?month=YYYY-MM` lists that month only.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const month = new URL(req.url).searchParams.get("month");
    let monthFilter: Prisma.CashCountWhereInput = {};
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map(Number);
      // By business day: the morning closure of the 1st still belongs to the previous month.
      monthFilter = { periodEnd: businessMonthRange(y, m) };
    }

    const open = await getOpenDayPeriod();
    const [expectation, counts, pending, categories] = await Promise.all([
      getCashExpectation(open.periodStart, open.periodEnd),
      prisma.cashCount.findMany({
        where: monthFilter,
        orderBy: { periodEnd: "desc" },
        take: month ? 62 : 30,
        include,
      }),
      prisma.cashCount.aggregate({
        where: { status: "TO_VERIFY" },
        _sum: { differenceCdf: true },
        _count: true,
      }),
      prisma.expenseCategory.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        open: {
          ...open,
          expectation,
          expectedCdf: expectedCash(expectation, open.openingFloatCdf),
        },
        counts: counts.map(serialize),
        pending: { count: pending._count, totalCdf: Number(pending._sum.differenceCdf ?? 0) },
        categories,
      },
    });
  } catch (error) {
    console.error("[CASH_COUNTS_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST {countedCdf, withdrawalCdf?, notes?}: closes the day. Everything since the last
 * closure is recomputed here (never taken from the browser); its sales become locked.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });
  // The day is closed when the money is handed to the owner: by the manager or the admin.
  if (!MANAGERS.includes(user.role ?? "")) {
    return NextResponse.json(
      { success: false, error: "La clôture de la journée est faite par le gérant ou l'administrateur" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const countedCdf = Math.round(Number(body.countedCdf));
    const withdrawalCdf = Math.round(Number(body.withdrawalCdf ?? 0));
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "";

    if (!Number.isFinite(countedCdf) || countedCdf < 0) {
      return NextResponse.json({ success: false, error: "Montant compté invalide" }, { status: 400 });
    }
    if (!Number.isFinite(withdrawalCdf) || withdrawalCdf < 0 || withdrawalCdf > countedCdf) {
      return NextResponse.json(
        { success: false, error: "Le versement doit être compris entre 0 et l'argent compté" },
        { status: 400 }
      );
    }

    const open = await getOpenDayPeriod();
    if (!open.ready) {
      return NextResponse.json(
        {
          success: false,
          error: "Faites d'abord la clôture de démarrage (Caisse › Démarrage).",
        },
        { status: 400 }
      );
    }

    const e = await getCashExpectation(open.periodStart, open.periodEnd);
    const expectedCdf = expectedCash(e, open.openingFloatCdf);
    const differenceCdf = countedCdf - expectedCdf;

    const row = await prisma.cashCount.create({
      data: {
        periodStart: open.periodStart,
        periodEnd: open.periodEnd,
        salesCashCdf: e.salesCashCdf,
        salesOtherCdf: e.salesOtherCdf,
        expensesCdf: e.expensesCdf,
        purchasesCdf: e.purchasesCdf,
        openingFloatCdf: open.openingFloatCdf,
        expectedCdf,
        countedCdf,
        differenceCdf,
        withdrawalCdf,
        status: differenceCdf === 0 ? "BALANCED" : "TO_VERIFY",
        notes: notes || null,
        userId: user.id,
      },
      include,
    });

    return NextResponse.json({
      success: true,
      data: { ...serialize(row), salesCount: e.salesCount, otherCount: e.otherCount },
    });
  } catch (error) {
    console.error("[CASH_COUNTS_POST]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH ?id= {status, categoryId?, resolutionNote?}: a manager settles a gap.
 *  - LOSS: an expense "Écart de caisse" of the missing amount.
 *  - JUSTIFIED: a shortfall becomes an expense in its real category (e.g. Transport);
 *    a surplus becomes an entry (negative expense) in "Écart de caisse".
 *  - TO_VERIFY: undoes the settlement.
 * The expense is dated inside the closed day, so the cash balance matches what was counted.
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });
  if (!MANAGERS.includes(user.role ?? "")) {
    return NextResponse.json(
      { success: false, error: "Seuls Admin/Manager peuvent régler un écart" },
      { status: 403 }
    );
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "ID manquant" }, { status: 400 });

  try {
    const body = await req.json();
    const status = String(body.status ?? "");
    const resolutionNote =
      typeof body.resolutionNote === "string" ? body.resolutionNote.trim().slice(0, 500) : "";
    if (!["TO_VERIFY", "LOSS", "JUSTIFIED"].includes(status)) {
      return NextResponse.json({ success: false, error: "Statut invalide" }, { status: 400 });
    }

    const count = await prisma.cashCount.findUnique({ where: { id } });
    if (!count) {
      return NextResponse.json({ success: false, error: "Clôture introuvable" }, { status: 404 });
    }
    const difference = Number(count.differenceCdf);
    if (difference === 0) {
      return NextResponse.json({ success: false, error: "Aucun écart à régler" }, { status: 400 });
    }
    if (difference > 0 && status === "LOSS") {
      return NextResponse.json(
        { success: false, error: "Un surplus ne peut pas être une perte : choisissez Justifié." },
        { status: 400 }
      );
    }

    // Category of the settlement expense.
    let categoryId: string | null = null;
    let categoryName: string | null = null;
    if (status === "JUSTIFIED" && difference < 0) {
      const cat = body.categoryId
        ? await prisma.expenseCategory.findUnique({ where: { id: String(body.categoryId) } })
        : null;
      if (!cat) {
        return NextResponse.json(
          { success: false, error: "Choisissez la catégorie de la dépense (ex : Transport)" },
          { status: 400 }
        );
      }
      categoryId = cat.id;
      categoryName = cat.name;
    } else if (status !== "TO_VERIFY") {
      categoryId = await ensureExpenseCategory(CASH_GAP_CATEGORY, "Manquants et surplus constatés à la clôture du jour");
      categoryName = CASH_GAP_CATEGORY;
    }

    const day = count.periodEnd.toLocaleDateString("fr-FR", { timeZone: "Africa/Kinshasa" });
    const label =
      status === "LOSS" ? "Perte" : difference > 0 ? "Surplus de caisse" : categoryName ?? "Justifié";

    const row = await prisma.$transaction(async (tx) => {
      if (count.settlementExpenseId) {
        await tx.expense.deleteMany({ where: { id: count.settlementExpenseId } });
      }
      let expenseId: string | null = null;
      if (categoryId) {
        const expense = await tx.expense.create({
          data: {
            description: `Écart de caisse du ${day} — ${label}${resolutionNote ? ` : ${resolutionNote}` : ""}`,
            // A shortfall is money spent (positive); a surplus is money found (negative expense).
            amount: new Prisma.Decimal(-difference),
            categoryId,
            source: "CASH_REGISTER",
            userId: user.id!,
            // Inside the closed period, so that period's figures stay coherent.
            date: new Date(count.periodEnd.getTime() - 1),
          },
        });
        expenseId = expense.id;
      }
      return tx.cashCount.update({
        where: { id },
        data: {
          status: status as "TO_VERIFY" | "LOSS" | "JUSTIFIED",
          resolutionNote: resolutionNote || null,
          resolvedByName: status === "TO_VERIFY" ? null : user.name ?? null,
          resolvedAt: status === "TO_VERIFY" ? null : new Date(),
          settlementExpenseId: expenseId,
          settlementCategory: status === "TO_VERIFY" ? null : categoryName,
        },
        include,
      });
    });

    return NextResponse.json({ success: true, data: serialize(row) });
  } catch (error) {
    console.error("[CASH_COUNTS_PATCH]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/** DELETE ?id=: an admin reopens the latest day closure (and removes its settlement). */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Seul un administrateur peut rouvrir une journée" },
      { status: 403 }
    );
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "ID manquant" }, { status: 400 });

  try {
    const latest = await prisma.cashCount.findFirst({ orderBy: { periodEnd: "desc" } });
    if (!latest || latest.id !== id) {
      return NextResponse.json(
        { success: false, error: "Seule la dernière clôture peut être rouverte" },
        { status: 400 }
      );
    }
    const coveredByMonth = await prisma.cashMonthClosure.count({
      where: { closedAt: { gte: latest.periodEnd } },
    });
    if (coveredByMonth > 0) {
      return NextResponse.json(
        { success: false, error: "Cette journée est déjà incluse dans une clôture du mois" },
        { status: 400 }
      );
    }
    await prisma.$transaction(async (tx) => {
      if (latest.settlementExpenseId) {
        await tx.expense.deleteMany({ where: { id: latest.settlementExpenseId } });
      }
      await tx.cashCount.delete({ where: { id } });
    });
    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "CashCount",
      entityId: id,
      metadata: {
        reopened: true,
        periodEnd: latest.periodEnd,
        countedCdf: Number(latest.countedCdf),
        differenceCdf: Number(latest.differenceCdf),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CASH_COUNTS_DELETE]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
