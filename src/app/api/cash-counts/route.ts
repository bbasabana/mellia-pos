import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { expectedCash, getCashExpectation, parseCountRange } from "@/lib/cash-count";

type SessionUser = { id?: string; name?: string | null; role?: string };

const MANAGERS = ["ADMIN", "MANAGER"];

function serialize(row: {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  salesCashCdf: Prisma.Decimal;
  salesOtherCdf: Prisma.Decimal;
  expensesCdf: Prisma.Decimal;
  purchasesCdf: Prisma.Decimal;
  openingFloatCdf: Prisma.Decimal;
  expectedCdf: Prisma.Decimal;
  countedCdf: Prisma.Decimal;
  differenceCdf: Prisma.Decimal;
  status: string;
  notes: string | null;
  resolutionNote: string | null;
  resolvedByName: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  user: { name: string };
}) {
  return {
    ...row,
    salesCashCdf: Number(row.salesCashCdf),
    salesOtherCdf: Number(row.salesOtherCdf),
    expensesCdf: Number(row.expensesCdf),
    purchasesCdf: Number(row.purchasesCdf),
    openingFloatCdf: Number(row.openingFloatCdf),
    expectedCdf: Number(row.expectedCdf),
    countedCdf: Number(row.countedCdf),
    differenceCdf: Number(row.differenceCdf),
    userName: row.user.name,
  };
}

const include = { user: { select: { name: true } } } as const;

/** GET ?from&to: what the till should hold for that day, and the latest counts. */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = parseCountRange(searchParams.get("from"), searchParams.get("to"));
  if (!range) {
    return NextResponse.json({ success: false, error: "Période invalide" }, { status: 400 });
  }

  try {
    const [expectation, counts, pending] = await Promise.all([
      getCashExpectation(range.gte, range.lte),
      prisma.cashCount.findMany({ orderBy: { createdAt: "desc" }, take: 30, include }),
      prisma.cashCount.aggregate({
        where: { status: "TO_VERIFY" },
        _sum: { differenceCdf: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        expectation,
        counts: counts.map(serialize),
        pending: { count: pending._count, totalCdf: Number(pending._sum.differenceCdf ?? 0) },
      },
    });
  } catch (error) {
    console.error("[CASH_COUNTS_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST {from, to, countedCdf, openingFloatCdf?, status?, notes?}: records the money counted.
 * The expected amount is recomputed here, never taken from the browser. A gap is classed
 * "à vérifier" unless the cashier calls it a loss; no gap is "correct".
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await req.json();
    const range = parseCountRange(body.from, body.to);
    const countedCdf = Math.round(Number(body.countedCdf));
    const openingFloatCdf = Math.round(Number(body.openingFloatCdf ?? 0));
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "";

    if (!range) {
      return NextResponse.json({ success: false, error: "Période invalide" }, { status: 400 });
    }
    if (!Number.isFinite(countedCdf) || countedCdf < 0) {
      return NextResponse.json({ success: false, error: "Montant compté invalide" }, { status: 400 });
    }
    if (!Number.isFinite(openingFloatCdf) || openingFloatCdf < 0) {
      return NextResponse.json({ success: false, error: "Fond de caisse invalide" }, { status: 400 });
    }

    const e = await getCashExpectation(range.gte, range.lte);
    const expectedCdf = expectedCash(e, openingFloatCdf);
    const differenceCdf = countedCdf - expectedCdf;
    const status = differenceCdf === 0 ? "BALANCED" : body.status === "LOSS" ? "LOSS" : "TO_VERIFY";

    const row = await prisma.cashCount.create({
      data: {
        periodStart: range.gte,
        periodEnd: range.lte,
        salesCashCdf: e.salesCashCdf,
        salesOtherCdf: e.salesOtherCdf,
        expensesCdf: e.expensesCdf,
        purchasesCdf: e.purchasesCdf,
        openingFloatCdf,
        expectedCdf,
        countedCdf,
        differenceCdf,
        status,
        notes: notes || null,
        userId: user.id,
      },
      include,
    });

    return NextResponse.json({ success: true, data: serialize(row) });
  } catch (error) {
    console.error("[CASH_COUNTS_POST]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/** PATCH ?id= {status, resolutionNote}: Admin/Manager settle a gap (loss, justified...). */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });
  if (!MANAGERS.includes(user.role ?? "")) {
    return NextResponse.json(
      { success: false, error: "Seuls Admin/Manager peuvent classer un écart" },
      { status: 403 }
    );
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "ID manquant" }, { status: 400 });

  try {
    const body = await req.json();
    const status = String(body.status ?? "");
    if (!["TO_VERIFY", "LOSS", "JUSTIFIED"].includes(status)) {
      return NextResponse.json({ success: false, error: "Statut invalide" }, { status: 400 });
    }
    const resolutionNote =
      typeof body.resolutionNote === "string" ? body.resolutionNote.trim().slice(0, 500) : "";

    const existing = await prisma.cashCount.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Contrôle introuvable" }, { status: 404 });
    }
    if (Number(existing.differenceCdf) === 0) {
      return NextResponse.json({ success: false, error: "Aucun écart à classer" }, { status: 400 });
    }

    const row = await prisma.cashCount.update({
      where: { id },
      data: {
        status: status as "TO_VERIFY" | "LOSS" | "JUSTIFIED",
        resolutionNote: resolutionNote || null,
        resolvedByName: status === "TO_VERIFY" ? null : user.name ?? null,
        resolvedAt: status === "TO_VERIFY" ? null : new Date(),
      },
      include,
    });

    return NextResponse.json({ success: true, data: serialize(row) });
  } catch (error) {
    console.error("[CASH_COUNTS_PATCH]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
