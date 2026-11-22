import { NextResponse } from "next/server";
import { prisma, prismaUnpooled } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { FundSource, Prisma, SaleUnit, StockLocation } from "@prisma/client";
import { getStartDate, withEra } from "@/lib/cash-period";
import { closedDayRefusal } from "@/lib/cash-count";
import { createAuditLog } from "@/lib/audit";
import { kinshasaPeriodStart, resolveEntryDate } from "@/lib/entry-date";
import { buildDescription, buyerKey, parseBuyer } from "@/lib/purchase-buyer";

/**
 * Menu Achat. A purchase (Investment) is a list of lines; each line adds stock (StockMovement IN
 * + StockItem) and carries its cost in FC. FC is the truth; USD is FC / the rate of the purchase.
 *
 * Totals are always recomputed here from the lines: total = Σ lines + transport,
 * revendable = lines of sellable products, charges = the other lines. The latest purchase of a
 * product also sets its cost price (prix de revient), used by the sales margins and the stock value.
 */

const MANAGERS = ["ADMIN", "MANAGER"];
const SOURCES: FundSource[] = ["OWNER_CAPITAL", "CASH_REGISTER"];
const LOCATIONS = Object.values(StockLocation) as string[];

type Tx = Prisma.TransactionClient;

class PurchaseError extends Error {}

function fail(error: string, status: number) {
    return NextResponse.json({ success: false, error }, { status });
}

async function activeRate(): Promise<number> {
    const rate = await prisma.exchangeRate.findFirst({ where: { active: true }, orderBy: { effectiveDate: "desc" } });
    return rate ? Number(rate.rateUsdToCdf) : 2850;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------------------------

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return fail("Non autorisé", 401);

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (id) {
            const investment = await prisma.investment.findUnique({
                where: { id },
                include: {
                    user: { select: { name: true } },
                    movements: {
                        include: {
                            product: {
                                select: { name: true, saleUnit: true, purchaseUnit: true, packingQuantity: true, vendable: true, type: true },
                            },
                        },
                    },
                },
            });
            if (!investment) return fail("Achat introuvable", 404);
            return NextResponse.json({ success: true, data: { ...investment, ...parseBuyer(investment.description) } });
        }

        const period = searchParams.get("period") || "month"; // day, week, month, year, all
        const source = searchParams.get("source");
        const buyer = searchParams.get("buyer");
        const startDate = kinshasaPeriodStart(period);

        // Before the start date everything is archived: shown only with ?archives=1.
        const periodWhere = withEra(
            startDate ? { date: { gte: startDate } } : {},
            "date",
            await getStartDate(),
            searchParams.get("archives") === "1"
        );

        const rows = await prisma.investment.findMany({
            where: periodWhere,
            orderBy: { date: "desc" },
            include: { user: { select: { name: true } }, _count: { select: { movements: true } } },
        });

        const withBuyer = rows.map((r) => ({ ...r, ...parseBuyer(r.description) }));
        const sourceOk = (r: (typeof withBuyer)[number]) => !source || r.source === source;
        const buyerOk = (r: (typeof withBuyer)[number]) => !buyer || buyerKey(r.buyer || r.user?.name || "") === buyerKey(buyer);

        // Per buyer: within the period and the chosen source. Per source: within the chosen buyer.
        const buyers = new Map<string, { name: string; totalCdf: number; count: number }>();
        for (const r of withBuyer.filter(sourceOk)) {
            const name = r.buyer || r.user?.name || "Inconnu";
            const key = buyerKey(name);
            const b = buyers.get(key) ?? { name, totalCdf: 0, count: 0 };
            b.totalCdf += Number(r.totalAmountCdf);
            b.count += 1;
            buyers.set(key, b);
        }
        const bySource = Object.fromEntries(SOURCES.map((s) => [s, { totalCdf: 0, count: 0 }])) as Record<FundSource, { totalCdf: number; count: number }>;
        for (const r of withBuyer.filter(buyerOk)) {
            bySource[r.source].totalCdf += Number(r.totalAmountCdf);
            bySource[r.source].count += 1;
        }

        const filtered = withBuyer.filter((r) => sourceOk(r) && buyerOk(r));
        const sum = (f: (r: (typeof filtered)[number]) => unknown) => filtered.reduce((a, r) => a + Number(f(r) || 0), 0);
        const stats = {
            count: filtered.length,
            totalCdf: sum((r) => r.totalAmountCdf),
            totalUsd: sum((r) => r.totalAmount),
            vendableCdf: sum((r) => r.vendableAmountCdf),
            nonVendableCdf: sum((r) => r.nonVendableAmountCdf),
            transportCdf: sum((r) => r.transportFeeCdf),
            expectedProfitCdf: sum((r) => r.expectedProfitCdf),
        };

        // Most bought products among the filtered purchases.
        const ids = filtered.map((r) => r.id);
        const top = ids.length
            ? await prisma.stockMovement.groupBy({
                by: ["productId"],
                where: { type: "IN", investmentId: { in: ids } },
                _count: { productId: true },
                _sum: { quantity: true, costValue: true },
                orderBy: { _count: { productId: "desc" } },
                take: 10,
            })
            : [];
        const topProducts = await prisma.product.findMany({
            where: { id: { in: top.map((t) => t.productId) } },
            select: { id: true, name: true, saleUnit: true },
        });
        const topItems = top.map((t) => {
            const p = topProducts.find((x) => x.id === t.productId);
            return {
                productId: t.productId,
                name: p?.name || "Inconnu",
                unit: p?.saleUnit || "PIECE",
                times: t._count.productId,
                quantity: Number(t._sum.quantity || 0),
                costCdf: Number(t._sum.costValue || 0),
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                history: filtered.slice(0, 300),
                stats,
                bySource,
                buyers: [...buyers.values()].sort((a, b) => b.totalCdf - a.totalCdf),
                analytics: { topItems },
            },
        });
    } catch (error) {
        console.error("Investment GET Error:", error);
        return fail("Erreur serveur", 500);
    }
}

// ---------------------------------------------------------------------------------------------
// Saving a purchase (shared by POST and PUT)
// ---------------------------------------------------------------------------------------------

type PurchaseInput = {
    date: Date;
    source: FundSource;
    description: string;
    rate: number;
    transportFeeCdf: number;
    items: Array<{
        productId?: string;
        isNew?: boolean;
        productName?: string;
        newUnit?: string;
        quantity: number;
        lineTotalCdf: number;
        location: StockLocation;
    }>;
};

/** Validates the body. Throws PurchaseError with a message for the user. */
function readInput(body: any, previousDate: Date | null): PurchaseInput {
    const source = (body.source || "OWNER_CAPITAL") as FundSource;
    if (!SOURCES.includes(source)) throw new PurchaseError("Source des fonds invalide");

    const rate = Number(body.exchangeRate);
    if (!(rate > 0)) throw new PurchaseError("Taux de change invalide");

    const transportFeeCdf = Number(body.transportFeeCdf || 0);
    if (!(transportFeeCdf >= 0)) throw new PurchaseError("Frais de transport invalides");

    // Buyer: sent apart by the form; older clients put it in the description.
    const parsed = parseBuyer(body.description);
    const buyer = String(body.buyerName ?? parsed.buyer ?? "").trim();
    if (buyer.length < 2) throw new PurchaseError("Indiquez qui a fait l'achat");
    const notes = body.buyerName !== undefined ? String(body.description ?? "") : parsed.notes;

    if (!Array.isArray(body.items) || body.items.length === 0) throw new PurchaseError("Ajoutez au moins un produit");
    const items = body.items.map((raw: any) => {
        const name = raw.productName || "produit";
        const quantity = Number(raw.quantity);
        if (!(quantity > 0)) throw new PurchaseError(`Quantité invalide pour ${name}`);
        // New clients send the line total; older ones a cost per stock unit.
        const lineTotalCdf = raw.lineTotalCdf !== undefined ? Number(raw.lineTotalCdf) : Number(raw.itemPrice) * quantity;
        if (!(lineTotalCdf >= 0) || !Number.isFinite(lineTotalCdf)) throw new PurchaseError(`Montant invalide pour ${name}`);
        const location = (raw.location || "DEPOT") as StockLocation;
        if (!LOCATIONS.includes(location)) throw new PurchaseError(`Destination invalide pour ${name}`);
        if (raw.isNew && !String(raw.productName || "").trim()) throw new PurchaseError("Nom du nouveau produit manquant");
        if (!raw.isNew && !raw.productId) throw new PurchaseError(`Produit manquant (${name})`);
        return {
            productId: raw.isNew ? undefined : String(raw.productId),
            isNew: !!raw.isNew,
            productName: raw.productName ? String(raw.productName).trim() : undefined,
            newUnit: raw.newUnit,
            quantity,
            lineTotalCdf: round2(lineTotalCdf),
            location,
        };
    });

    return {
        date: resolveEntryDate(body.date, previousDate),
        source,
        description: buildDescription(buyer, notes),
        rate,
        transportFeeCdf: round2(transportFeeCdf),
        items,
    };
}

/** Writes the lines, the stock and the totals of a purchase. The record must already exist. */
async function writeLines(tx: Tx, investmentId: string, input: PurchaseInput, userId: string, reason: string) {
    const { rate } = input;
    let vendableCdf = 0;
    let nonVendableCdf = 0;
    let revenueCdf = 0;
    let revenueVipCdf = 0;
    // Per product, for its cost price: Σ cost / Σ stock quantity of this purchase.
    const perProduct = new Map<string, { saleUnit: SaleUnit; cost: number; qty: number }>();

    for (const item of input.items) {
        let product;
        if (item.isNew) {
            product =
                (await tx.product.findFirst({
                    where: { name: { equals: item.productName!, mode: "insensitive" }, type: "NON_VENDABLE" },
                    include: { prices: { include: { space: true } } },
                })) ??
                (await tx.product.create({
                    data: {
                        name: item.productName!,
                        type: "NON_VENDABLE",
                        active: true,
                        vendable: false,
                        saleUnit: (Object.values(SaleUnit) as string[]).includes(item.newUnit || "") ? (item.newUnit as SaleUnit) : "PIECE",
                        size: "STANDARD",
                    },
                    include: { prices: { include: { space: true } } },
                }));
        } else {
            product = await tx.product.findUnique({ where: { id: item.productId! }, include: { prices: { include: { space: true } } } });
            if (!product) throw new PurchaseError(`Produit introuvable (${item.productName || item.productId})`);
        }

        const sellable = product.type !== "NON_VENDABLE";
        if (sellable) {
            vendableCdf += item.lineTotalCdf;
            // Expected revenue: selling price of the sale unit, Terrasse (standard) and VIP.
            const prices = product.prices.filter((p) => p.forUnit === product.saleUnit);
            const list = prices.length ? prices : product.prices;
            const isVip = (n: string) => n.toLowerCase().includes("vip");
            const standard =
                list.find((p) => ["terrasse", "salle", "standard"].includes(p.space.name.toLowerCase().trim())) ??
                list.find((p) => !isVip(p.space.name));
            const vip = list.find((p) => isVip(p.space.name));
            const priceStd = standard ? Number(standard.priceCdf) : 0;
            revenueCdf += priceStd * item.quantity;
            revenueVipCdf += (vip ? Number(vip.priceCdf) : priceStd) * item.quantity;
        } else {
            nonVendableCdf += item.lineTotalCdf;
        }

        const agg = perProduct.get(product.id) ?? { saleUnit: product.saleUnit, cost: 0, qty: 0 };
        agg.cost += item.lineTotalCdf;
        agg.qty += item.quantity;
        perProduct.set(product.id, agg);

        await tx.stockMovement.create({
            data: {
                productId: product.id,
                type: "IN",
                quantity: item.quantity,
                toLocation: item.location,
                reason: `${reason} #${investmentId.slice(-4)}`,
                costValue: item.lineTotalCdf,
                userId,
                investmentId,
            },
        });
        await tx.stockItem.upsert({
            where: { productId_location: { productId: product.id, location: item.location } },
            update: { quantity: { increment: item.quantity } },
            create: { productId: product.id, location: item.location, quantity: item.quantity },
        });
    }

    // Cost price follows the latest purchase of the product (an older, back-dated one does not).
    for (const [productId, agg] of perProduct) {
        if (agg.qty <= 0 || agg.cost <= 0) continue;
        const newer = await tx.investment.findFirst({
            where: { id: { not: investmentId }, date: { gt: input.date }, movements: { some: { productId } } },
            select: { id: true },
        });
        if (newer) continue;
        const unitCostCdf = round2(agg.cost / agg.qty);
        const unitCostUsd = round2(unitCostCdf / rate);
        await tx.productCost.upsert({
            where: { productId_forUnit: { productId, forUnit: agg.saleUnit } },
            update: { unitCostCdf, unitCostUsd },
            create: { productId, forUnit: agg.saleUnit, unitCostCdf, unitCostUsd },
        });
        if (agg.saleUnit === "PLATE") {
            await tx.productCost.updateMany({
                where: { productId, forUnit: "HALF_PLATE" },
                data: { unitCostCdf: round2(unitCostCdf / 2), unitCostUsd: round2(unitCostUsd / 2) },
            });
        }
    }

    const totalCdf = round2(vendableCdf + nonVendableCdf + input.transportFeeCdf);
    // Expected margin on the sellable stock: what it sells for minus what it cost.
    const profitCdf = revenueCdf - vendableCdf;
    const profitVipCdf = revenueVipCdf - vendableCdf;
    const usd = (n: number) => round2(n / rate);

    return tx.investment.update({
        where: { id: investmentId },
        data: {
            totalAmountCdf: totalCdf,
            totalAmount: usd(totalCdf),
            vendableAmountCdf: vendableCdf,
            vendableAmount: usd(vendableCdf),
            nonVendableAmountCdf: nonVendableCdf,
            nonVendableAmount: usd(nonVendableCdf),
            transportFeeCdf: input.transportFeeCdf,
            transportFee: usd(input.transportFeeCdf),
            expectedRevenueCdf: revenueCdf,
            expectedRevenue: usd(revenueCdf),
            expectedProfitCdf: profitCdf,
            expectedProfit: usd(profitCdf),
            expectedRevenueVipCdf: revenueVipCdf,
            expectedRevenueVip: usd(revenueVipCdf),
            expectedProfitVipCdf: profitVipCdf,
            expectedProfitVip: usd(profitVipCdf),
        },
    });
}

/** Takes the stock of a purchase back out and removes its lines. */
async function reverseLines(tx: Tx, investmentId: string) {
    const old = await tx.stockMovement.findMany({ where: { investmentId } });
    for (const mov of old) {
        if (mov.type === "IN" && mov.toLocation) {
            await tx.stockItem.upsert({
                where: { productId_location: { productId: mov.productId, location: mov.toLocation } },
                update: { quantity: { decrement: mov.quantity } },
                create: { productId: mov.productId, location: mov.toLocation, quantity: 0 },
            });
        }
    }
    await tx.stockMovement.deleteMany({ where: { investmentId } });
}

async function managerSession() {
    const session = await getServerSession(authOptions);
    if (!session) return { error: fail("Non autorisé", 401) };
    const role = (session.user as any)?.role as string | undefined;
    if (!role || !MANAGERS.includes(role)) return { error: fail("Les achats sont gérés par le gérant ou l'administrateur", 403) };
    return { session, role, userId: session.user.id as string };
}

// ---------------------------------------------------------------------------------------------
// POST: new purchase → stock in
// ---------------------------------------------------------------------------------------------

export async function POST(req: Request) {
    try {
        const auth = await managerSession();
        if ("error" in auth) return auth.error;

        const input = readInput(await req.json(), null);

        // A purchase paid from the till cannot land in a closed day (admins excepted).
        if (input.source === "CASH_REGISTER") {
            const refusal = await closedDayRefusal(input.date, auth.role);
            if (refusal) return fail(refusal, 403);
        }

        const result = await prismaUnpooled.$transaction(
            async (tx) => {
                const investment = await tx.investment.create({
                    data: {
                        date: input.date,
                        source: input.source,
                        description: input.description,
                        exchangeRate: input.rate,
                        totalAmount: 0,
                        vendableAmount: 0,
                        nonVendableAmount: 0,
                        expectedRevenue: 0,
                        expectedProfit: 0,
                        userId: auth.userId,
                    },
                });
                return writeLines(tx, investment.id, input, auth.userId, "Achat");
            },
            { timeout: 30_000, maxWait: 10_000 }
        );

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof PurchaseError) return fail(error.message, 400);
        console.error("Investment POST Error:", error);
        return fail("Erreur serveur", 500);
    }
}

// ---------------------------------------------------------------------------------------------
// PUT: edit a purchase → stock re-synced. Who recorded it stays the same; the edit is logged.
// ---------------------------------------------------------------------------------------------

export async function PUT(req: Request) {
    try {
        const auth = await managerSession();
        if ("error" in auth) return auth.error;

        const body = await req.json();
        if (!body.id) return fail("Achat introuvable", 400);
        const current = await prisma.investment.findUnique({ where: { id: body.id } });
        if (!current) return fail("Achat introuvable", 404);

        const input = readInput(body, current.date);

        const refusal =
            (current.source === "CASH_REGISTER" ? await closedDayRefusal(current.date, auth.role) : null) ??
            (input.source === "CASH_REGISTER" ? await closedDayRefusal(input.date, auth.role) : null);
        if (refusal) return fail(refusal, 403);

        const result = await prismaUnpooled.$transaction(
            async (tx) => {
                await reverseLines(tx, current.id);
                await tx.investment.update({
                    where: { id: current.id },
                    data: { date: input.date, source: input.source, description: input.description, exchangeRate: input.rate },
                });
                return writeLines(tx, current.id, input, auth.userId, "Achat modifié");
            },
            { timeout: 30_000, maxWait: 10_000 }
        );

        await createAuditLog({
            userId: auth.userId,
            action: "UPDATE_PURCHASE",
            entity: "Investment",
            entityId: current.id,
            metadata: {
                before: { date: current.date, source: current.source, totalAmountCdf: Number(current.totalAmountCdf), description: current.description },
                after: { date: result.date, source: result.source, totalAmountCdf: Number(result.totalAmountCdf), description: result.description },
            },
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof PurchaseError) return fail(error.message, 400);
        console.error("Investment PUT Error:", error);
        return fail("Erreur serveur", 500);
    }
}

// ---------------------------------------------------------------------------------------------
// DELETE: remove a purchase → stock taken back out
// ---------------------------------------------------------------------------------------------

export async function DELETE(req: Request) {
    try {
        const auth = await managerSession();
        if ("error" in auth) return auth.error;

        const id = new URL(req.url).searchParams.get("id");
        if (!id) return fail("Achat introuvable", 400);

        const existing = await prisma.investment.findUnique({ where: { id } });
        if (!existing) return fail("Achat introuvable", 404);
        if (existing.source === "CASH_REGISTER") {
            const refusal = await closedDayRefusal(existing.date, auth.role);
            if (refusal) return fail(refusal, 403);
        }

        await prismaUnpooled.$transaction(
            async (tx) => {
                await reverseLines(tx, id);
                await tx.investment.delete({ where: { id } });
            },
            { timeout: 30_000, maxWait: 10_000 }
        );

        await createAuditLog({
            userId: auth.userId,
            action: "DELETE_PURCHASE",
            entity: "Investment",
            entityId: id,
            metadata: { date: existing.date, source: existing.source, totalAmountCdf: Number(existing.totalAmountCdf), description: existing.description },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Investment DELETE Error:", error);
        return fail("Erreur serveur", 500);
    }
}
