import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { ensureAdjustmentCategoryId, getStartDate } from "@/lib/cash-period";
import { activeRate, caisseState } from "@/lib/caisse-state";
import { getCashExpectation, getOpenDayPeriod } from "@/lib/cash-count";

type SessionUser = { id?: string; name?: string | null; role?: string };

const MANAGERS = ["ADMIN", "MANAGER"];
type CountMeta = {
  usd: number;
  cdf: number;
  rate: number;
  totalCdf: number;
  theoreticalCdf: number;
  differenceCdf: number;
  notes?: string | null;
  expenseId?: string | null;
  /** Earlier values when the count was corrected. */
  edits?: Array<{ at: string; by: string; usd: number; cdf: number; rate: number; totalCdf: number }>;
};

const countDetail = (usd: number, cdf: number, rate: number) =>
  `${usd.toLocaleString("fr-FR")} $ + ${cdf.toLocaleString("fr-FR")} FC (taux ${rate.toLocaleString("fr-FR")})`;

const countDescription = (usd: number, cdf: number, rate: number, differenceCdf: number, notes: string) =>
  `Comptage de la caisse : ${countDetail(usd, cdf, rate)} — ${differenceCdf > 0 ? "surplus" : "manquant"}${notes ? ` · ${notes}` : ""}`;

/** Only the latest count can be corrected, and not once a start-up / month closure came after it. */
async function editableCountId(): Promise<string | null> {
  const latest = await prisma.auditLog.findFirst({
    where: { action: "CASH_COUNT", entity: "Caisse" },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });
  if (!latest) return null;
  const after = await prisma.cashMonthClosure.count({ where: { closedAt: { gt: latest.createdAt } } });
  return after === 0 ? latest.id : null;
}

/** GET: the Caisse balance, its breakdown, the open day, recent counts and closures. */
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });
  if (!MANAGERS.includes(user.role ?? "")) {
    return NextResponse.json({ success: false, error: "Réservé au gérant et à l'administrateur" }, { status: 403 });
  }

  try {
    const [state, rate, startDate, open, countLogs, closures, editableId] = await Promise.all([
      caisseState(),
      activeRate(),
      getStartDate(),
      getOpenDayPeriod(),
      prisma.auditLog.findMany({
        where: { action: "CASH_COUNT", entity: "Caisse" },
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { user: { select: { name: true } } },
      }),
      prisma.cashMonthClosure.findMany({
        orderBy: { closedAt: "desc" },
        take: 12,
        include: { user: { select: { name: true } } },
      }),
      editableCountId(),
    ]);

    const expectation = await getCashExpectation(open.periodStart, open.periodEnd);
    const canRedoStart =
      startDate !== null &&
      (await prisma.cashCount.count({ where: { periodEnd: { gte: startDate } } })) === 0;

    const t = state.totals;
    return NextResponse.json({
      success: true,
      data: {
        rate,
        startDate,
        canRedoStart,
        base: state.lastClosure
          ? {
              kind: state.lastClosure.kind,
              label: state.lastClosure.label,
              at: state.lastClosure.closedAt,
              amountCdf: state.openingBalance,
              notes: state.lastClosure.notes,
            }
          : null,
        breakdown: {
          openingCdf: state.openingBalance,
          salesCashCdf: Math.round(t.totalSales),
          salesCashCount: state.cashSalesCount,
          expensesCdf: Math.round(t.totalExpenses),
          purchasesCdf: Math.round(t.totalPurchases),
          adjustmentsCdf: Math.round(t.totalAdjustments ?? 0),
          handedToOwnerCdf: Math.round(t.totalWithdrawals ?? 0),
          salesOtherCdf: Math.round(state.otherSales.cdf),
          salesOtherCount: state.otherSales.count,
          ownerExpensesCdf: Math.round(state.ownerExpensesCdf),
          ownerPurchasesCdf: Math.round(state.ownerPurchasesCdf),
        },
        balanceCdf: state.balance,
        openDay: {
          ready: open.ready,
          since: open.periodStart,
          salesCount: expectation.salesCount,
          salesCashCdf: expectation.salesCashCdf,
        },
        counts: countLogs.map((log) => {
          const m = (log.metadata ?? {}) as Partial<CountMeta>;
          return {
            id: log.id,
            at: log.createdAt,
            userName: log.user.name,
            usd: Number(m.usd ?? 0),
            cdf: Number(m.cdf ?? 0),
            rate: Number(m.rate ?? 0),
            totalCdf: Number(m.totalCdf ?? 0),
            theoreticalCdf: Number(m.theoreticalCdf ?? 0),
            differenceCdf: Number(m.differenceCdf ?? 0),
            notes: m.notes ?? null,
            editable: log.id === editableId,
            edited: (m.edits ?? []).length,
          };
        }),
        closures: closures.map((c) => ({
          id: c.id,
          kind: c.kind,
          label: c.label,
          closedAt: c.closedAt,
          closingBalanceCdf: Number(c.closingBalanceCdf),
          totalSalesCdf: Number(c.totalSalesCdf),
          adjustmentCdf: Number(c.adjustmentCdf),
          notes: c.notes,
          userName: c.user.name,
        })),
      },
    });
  } catch (error) {
    console.error("[CAISSE_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST {usd, cdf, notes?}: the money of the Caisse is counted, dollars and francs apart.
 * The total in FC (dollars at the active rate) becomes the balance: a gap is booked as a
 * correction ("Ajustement de Caisse"), which the day closure ignores.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });
  if (!MANAGERS.includes(user.role ?? "")) {
    return NextResponse.json(
      { success: false, error: "Le comptage de la caisse est fait par le gérant ou l'administrateur" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const usd = Math.round(Number(body.usd ?? 0) * 100) / 100;
    const cdf = Math.round(Number(body.cdf ?? 0));
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 300) : "";
    if (!Number.isFinite(usd) || usd < 0 || !Number.isFinite(cdf) || cdf < 0) {
      return NextResponse.json({ success: false, error: "Montants invalides" }, { status: 400 });
    }

    if (!(await getStartDate())) {
      return NextResponse.json(
        { success: false, error: "Faites d'abord la clôture de démarrage (bouton « Démarrage »)." },
        { status: 400 }
      );
    }

    const [rate, state] = await Promise.all([activeRate(), caisseState()]);
    const totalCdf = Math.round(usd * rate + cdf);
    const differenceCdf = totalCdf - state.balance;

    let expenseId: string | null = null;
    if (differenceCdf !== 0) {
      const categoryId = await ensureAdjustmentCategoryId();
      const expense = await prisma.expense.create({
        data: {
          description: countDescription(usd, cdf, rate, differenceCdf, notes),
          // A surplus is money found (negative correction), a shortfall money missing.
          amount: new Prisma.Decimal(-differenceCdf),
          categoryId,
          source: "CASH_REGISTER",
          userId: user.id,
          date: new Date(),
        },
      });
      expenseId = expense.id;
    }

    const meta: CountMeta = {
      usd,
      cdf,
      rate,
      totalCdf,
      theoreticalCdf: state.balance,
      differenceCdf,
      notes: notes || null,
      expenseId,
    };
    await createAuditLog({ userId: user.id, action: "CASH_COUNT", entity: "Caisse", entityId: expenseId ?? undefined, metadata: meta });

    return NextResponse.json({ success: true, data: meta });
  } catch (error) {
    console.error("[CAISSE_POST]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH {id, usd, cdf, rate?, notes?}: corrects the latest count (a mistake in dollars, in
 * francs or in the rate). The gap is recomputed against the balance expected at the time of
 * the count, its correction is updated, and the earlier values are kept in the history.
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });
  if (!MANAGERS.includes(user.role ?? "")) {
    return NextResponse.json({ success: false, error: "Réservé au gérant et à l'administrateur" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const id = String(body.id ?? "");
    const usd = Math.round(Number(body.usd ?? 0) * 100) / 100;
    const cdf = Math.round(Number(body.cdf ?? 0));
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 300) : "";
    if (!Number.isFinite(usd) || usd < 0 || !Number.isFinite(cdf) || cdf < 0) {
      return NextResponse.json({ success: false, error: "Montants invalides" }, { status: 400 });
    }

    const log = await prisma.auditLog.findUnique({ where: { id } });
    if (!log || log.action !== "CASH_COUNT" || log.entity !== "Caisse") {
      return NextResponse.json({ success: false, error: "Comptage introuvable" }, { status: 404 });
    }
    if ((await editableCountId()) !== id) {
      return NextResponse.json(
        {
          success: false,
          error: "Seul le dernier comptage peut être modifié, et pas après un démarrage ou une clôture du mois.",
        },
        { status: 400 }
      );
    }

    const before = (log.metadata ?? {}) as CountMeta;
    const askedRate = Number(body.rate);
    const rate = Number.isFinite(askedRate) && askedRate > 0 ? askedRate : Number(before.rate) || (await activeRate());
    const totalCdf = Math.round(usd * rate + cdf);
    const theoreticalCdf = Number(before.theoreticalCdf ?? 0);
    const differenceCdf = totalCdf - theoreticalCdf;

    const categoryId = differenceCdf !== 0 ? await ensureAdjustmentCategoryId() : null;
    const meta = await prisma.$transaction(async (tx) => {
      let expenseId = before.expenseId ?? null;
      const existing = expenseId ? await tx.expense.findUnique({ where: { id: expenseId } }) : null;
      if (differenceCdf === 0) {
        if (existing) await tx.expense.delete({ where: { id: existing.id } });
        expenseId = null;
      } else if (existing) {
        await tx.expense.update({
          where: { id: existing.id },
          data: { amount: new Prisma.Decimal(-differenceCdf), description: countDescription(usd, cdf, rate, differenceCdf, notes) },
        });
      } else {
        const created = await tx.expense.create({
          data: {
            description: countDescription(usd, cdf, rate, differenceCdf, notes),
            amount: new Prisma.Decimal(-differenceCdf),
            categoryId: categoryId!,
            source: "CASH_REGISTER",
            userId: user.id!,
            date: log.createdAt,
          },
        });
        expenseId = created.id;
      }

      const next: CountMeta = {
        usd,
        cdf,
        rate,
        totalCdf,
        theoreticalCdf,
        differenceCdf,
        notes: notes || null,
        expenseId,
        edits: [
          ...(before.edits ?? []),
          {
            at: new Date().toISOString(),
            by: session?.user?.name ?? "",
            usd: Number(before.usd ?? 0),
            cdf: Number(before.cdf ?? 0),
            rate: Number(before.rate ?? 0),
            totalCdf: Number(before.totalCdf ?? 0),
          },
        ],
      };
      await tx.auditLog.update({ where: { id }, data: { metadata: next, entityId: expenseId } });
      return next;
    }, { timeout: 20000 });

    await createAuditLog({
      userId: user.id,
      action: "CASH_COUNT_EDIT",
      entity: "Caisse",
      entityId: id,
      metadata: {
        before: { usd: before.usd, cdf: before.cdf, rate: before.rate, totalCdf: before.totalCdf },
        after: { usd, cdf, rate, totalCdf },
      },
    });

    return NextResponse.json({ success: true, data: meta });
  } catch (error) {
    console.error("[CAISSE_PATCH]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
