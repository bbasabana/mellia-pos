import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { FundSource, StockLocation } from "@prisma/client";

// GET: Fetch Investment Stats & History
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
                                select: {
                                    name: true,
                                    saleUnit: true,
                                    purchaseUnit: true,
                                    packingQuantity: true
                                }
                            }
                        }
                    }
                }
            });
            return NextResponse.json({ success: true, data: investment });
        }

        // 1. Get recent investments
        const investments = await prisma.investment.findMany({
            take: 20,
            orderBy: { date: 'desc' },
            include: { user: { select: { name: true } } }
        });

        // 2. Calculate Aggregates (Month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyInvestments = await prisma.investment.aggregate({
            where: { date: { gte: startOfMonth } },
            _sum: {
                totalAmount: true,
                expectedProfit: true,
                vendableAmount: true,
                nonVendableAmount: true
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                history: investments,
                stats: {
                    monthTotal: monthlyInvestments._sum.totalAmount || 0,
                    monthVendable: monthlyInvestments._sum.vendableAmount || 0,
                    monthNonVendable: monthlyInvestments._sum.nonVendableAmount || 0,
                    monthExpectedProfit: monthlyInvestments._sum.expectedProfit || 0
                }
            }
        });

    } catch (error) {
        console.error("Investment GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create New Investment (Purchase) -> Updates Stock
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const {
            totalAmount,
            source,
            description,
            items // Array of { productId, quantity, cost, isVendable }
        } = body;

        if (!totalAmount || !items || items.length === 0) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        // Transaction: Create Investment + Stock Movements + Update StockItems
        const result = await prisma.$transaction(async (tx) => {
            let vendableTotal = 0;
            let expectedRevenue = 0;
            let expectedRevenueVip = 0;
            let finalItems = [];

            // 1. Pre-process items (create new products if needed)
            for (const item of items) {
                let actualProductId = item.productId;
                let isVendable = item.isVendable;

                if (item.isNew) {
                    const newProduct = await tx.product.create({
                        data: {
                            name: item.productName,
                            type: "NON_VENDABLE",
                            active: true,
                            vendable: false,
                            saleUnit: item.newUnit || "PIECE",
                            size: "STANDARD",
                        }
                    });
                    actualProductId = newProduct.id;
                    isVendable = false;

                    // Create cost record for the new product
                    await tx.productCost.create({
                        data: {
                            productId: actualProductId,
                            unitCostUsd: item.cost,
                            unitCostCdf: item.cost * (parseFloat(body.exchangeRate) || 2850),
                            forUnit: item.newUnit || "PIECE"
                        }
                    });
                }

                if (isVendable) {
                    vendableTotal += (item.cost * item.quantity);

                    // ROI Logic: Get selling prices
                    const prices = await tx.productPrice.findMany({
                        where: { productId: actualProductId },
                        include: { space: true }
                    });

                    // 1. STANDARD/TERRASSE PRICE
                    const standardPriceEntry = prices.find(p =>
                        ['TERRASSE', 'SALLE', 'STANDARD'].includes(p.space.name.toUpperCase())
                    ) || prices[0];
                    const standardPrice = standardPriceEntry ? Number(standardPriceEntry.priceUsd) : 0;
                    expectedRevenue += (standardPrice * item.quantity);

                    // 2. VIP PRICE
                    const vipPriceEntry = prices.find(p =>
                        p.space.name.toUpperCase().includes('VIP')
                    ) || standardPriceEntry;
                    const vipPrice = vipPriceEntry ? Number(vipPriceEntry.priceUsd) : standardPrice;
                    expectedRevenueVip += (vipPrice * item.quantity);
                }

                finalItems.push({
                    ...item,
                    productId: actualProductId,
                    isVendable
                });
            }

            const nonVendableTotal = Number(totalAmount) - vendableTotal;
            const expectedProfit = expectedRevenue - vendableTotal;
            const expectedProfitVip = expectedRevenueVip - vendableTotal;

            // 2. Create Investment Record
            const investment = await tx.investment.create({
                data: {
                    totalAmount: totalAmount,
                    totalAmountCdf: body.totalAmountCdf || 0,
                    exchangeRate: body.exchangeRate || 0,
                    source: source as FundSource,
                    vendableAmount: vendableTotal,
                    nonVendableAmount: nonVendableTotal,
                    expectedRevenue: expectedRevenue,
                    expectedProfit: expectedProfit,
                    expectedRevenueVip: expectedRevenueVip,
                    expectedProfitVip: expectedProfitVip,
                    description,
                    userId: session.user.id
                }
            });

            // 3. Process Movements & Stock
            for (const item of finalItems) {
                const targetLocation = (item.location as StockLocation) || "DEPOT";

                // A. Create Stock Movement (IN)
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: "IN",
                        quantity: item.quantity,
                        toLocation: targetLocation,
                        reason: `Achat Investissement #${investment.id.slice(-4)}`,
                        costValue: item.cost * item.quantity,
                        userId: session.user.id,
                        investmentId: investment.id
                    }
                });

                // B. Update Stock Item
                await tx.stockItem.upsert({
                    where: { productId_location: { productId: item.productId, location: targetLocation } },
                    update: { quantity: { increment: Number(item.quantity) } },
                    create: {
                        productId: item.productId,
                        location: targetLocation,
                        quantity: Number(item.quantity)
                    }
                });
            }

            return investment;
        });

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        console.error("Investment POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: Edit Investment + Re-sync Stock
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { id, totalAmount, source, description, items } = body;

        if (!id || !totalAmount || !items || items.length === 0) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. REVERSE OLD STOCK Changes
            const oldMovements = await tx.stockMovement.findMany({
                where: { investmentId: id }
            });

            for (const mov of oldMovements) {
                if (mov.type === "IN" && mov.toLocation) {
                    await tx.stockItem.upsert({
                        where: { productId_location: { productId: mov.productId, location: mov.toLocation } },
                        update: { quantity: { decrement: mov.quantity } },
                        create: { productId: mov.productId, location: mov.toLocation, quantity: 0 }
                    });
                }
            }

            // 2. Clear old movements
            await tx.stockMovement.deleteMany({ where: { investmentId: id } });

            // 3. APPLY NEW DATA
            let vendableTotal = 0;
            let expectedRevenue = 0;
            let expectedRevenueVip = 0;
            let finalItems = [];

            for (const item of items) {
                let actualProductId = item.productId;
                let isVendable = item.isVendable;

                // Handle isNew in Edit? (Ideally products already created, but for safety)
                if (item.isNew && !actualProductId.startsWith("cl")) {
                    const newProduct = await tx.product.create({
                        data: {
                            name: item.productName,
                            type: "NON_VENDABLE",
                            active: true,
                            vendable: false,
                            saleUnit: item.newUnit || "PIECE",
                            size: "STANDARD",
                        }
                    });
                    actualProductId = newProduct.id;
                    isVendable = false;
                }

                if (isVendable) {
                    vendableTotal += (item.cost * item.quantity);
                    const prices = await tx.productPrice.findMany({
                        where: { productId: actualProductId },
                        include: { space: true }
                    });

                    const standardPriceEntry = prices.find(p => ['TERRASSE', 'SALLE', 'STANDARD'].includes(p.space.name.toUpperCase())) || prices[0];
                    const standardPrice = standardPriceEntry ? Number(standardPriceEntry.priceUsd) : 0;
                    expectedRevenue += (standardPrice * item.quantity);

                    const vipPriceEntry = prices.find(p => p.space.name.toUpperCase().includes('VIP')) || standardPriceEntry;
                    const vipPrice = vipPriceEntry ? Number(vipPriceEntry.priceUsd) : standardPrice;
                    expectedRevenueVip += (vipPrice * item.quantity);
                }

                finalItems.push({ ...item, productId: actualProductId, isVendable });
            }

            const nonVendableTotal = Number(totalAmount) - vendableTotal;
            const expectedProfit = expectedRevenue - vendableTotal;
            const expectedProfitVip = expectedRevenueVip - vendableTotal;

            // 4. Update Investment Record
            const investment = await tx.investment.update({
                where: { id },
                data: {
                    totalAmount,
                    totalAmountCdf: body.totalAmountCdf || 0,
                    exchangeRate: body.exchangeRate || 0,
                    source: source as FundSource,
                    vendableAmount: vendableTotal,
                    nonVendableAmount: nonVendableTotal,
                    expectedRevenue,
                    expectedProfit,
                    expectedRevenueVip,
                    expectedProfitVip,
                    description,
                    userId: session.user.id
                }
            });

            // 5. Create new Movements & update StockItems
            for (const item of finalItems) {
                const targetLocation = (item.location as StockLocation) || "DEPOT";
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: "IN",
                        quantity: item.quantity,
                        toLocation: targetLocation,
                        reason: `Mise à jour Achat #${investment.id.slice(-4)}`,
                        costValue: item.cost * item.quantity,
                        userId: session.user.id,
                        investmentId: investment.id
                    }
                });

                await tx.stockItem.upsert({
                    where: { productId_location: { productId: item.productId, location: targetLocation } },
                    update: { quantity: { increment: Number(item.quantity) } },
                    create: { productId: item.productId, location: targetLocation, quantity: Number(item.quantity) }
                });
            }

            return investment;
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Investment PUT Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
