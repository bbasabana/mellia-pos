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
                                    packingQuantity: true,
                                    vendable: true,
                                    type: true
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
        let {
            totalAmount,
            source,
            description,
            date, // Extract date
            items, // Array of { productId, quantity, cost, isVendable }
            transportFee = 0 // Extract transport fee (default 0)
        } = body;

        // Validation Fix: Accept totalAmountCdf if totalAmount is missing
        if (!totalAmount && body.totalAmountCdf) {
            const rate = parseFloat(body.exchangeRate) || 2850;
            totalAmount = Number(body.totalAmountCdf) / rate;
        }

        if ((!totalAmount && !body.totalAmountCdf) || !items || items.length === 0) {
            return NextResponse.json({ error: "Invalid data: Missing totalAmount or Items" }, { status: 400 });
        }

        // Transaction: Create Investment + Stock Movements + Update StockItems
        const result = await prisma.$transaction(async (tx) => {
            let vendableTotalCdf = 0;
            let expectedRevenueCdf = 0;
            let expectedRevenueVipCdf = 0;
            let finalItems = [];

            const exchangeRateVal = parseFloat(body.exchangeRate) || 2850;

            // 1. Pre-process items (create new products if needed)
            for (const item of items) {
                let actualProductId = item.productId;
                let isVendable = item.isVendable;

                if (item.isNew) {
                    const existingProduct = await tx.product.findFirst({
                        where: {
                            name: { equals: item.productName, mode: 'insensitive' },
                            type: 'NON_VENDABLE'
                        }
                    });

                    if (existingProduct) {
                        actualProductId = existingProduct.id;
                        isVendable = existingProduct.vendable;
                    } else {
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

                        // Create cost record (CDF First)
                        const costCdf = Number(item.itemPrice);
                        await tx.productCost.create({
                            data: {
                                productId: actualProductId,
                                unitCostCdf: costCdf,
                                unitCostUsd: costCdf / exchangeRateVal,
                                forUnit: item.newUnit || "PIECE"
                            }
                        });
                    }
                }

                // Calculate item cost in CDF immediately to avoid drift
                // Frontend sends itemPrice in CDF always
                const itemUnitCostCdf = Number(item.itemPrice);
                const itemLineTotalCdf = itemUnitCostCdf * item.quantity;

                if (isVendable) {
                    vendableTotalCdf += itemLineTotalCdf;

                    // ROI Logic: Get selling prices in CDF
                    const prices = await tx.productPrice.findMany({
                        where: { productId: actualProductId },
                        include: { space: true }
                    });

                    // 1. TERRASSE/STANDARD Price (CDF)
                    const standardPriceEntry = prices.find(p => {
                        const name = p.space.name.toLowerCase().trim();
                        return name === 'terrasse' || name === 'salle' || name === 'standard';
                    });
                    const fallbackPrice = prices.find(p => !p.space.name.toLowerCase().includes('vip'));

                    const priceTerrasseCdf = standardPriceEntry
                        ? Number(standardPriceEntry.priceCdf)
                        : (fallbackPrice ? Number(fallbackPrice.priceCdf) : 0);

                    expectedRevenueCdf += (priceTerrasseCdf * item.quantity);

                    // 2. VIP Price (CDF)
                    const vipPriceEntry = prices.find(p => p.space.name.toLowerCase().includes('vip'));
                    const priceVipCdf = vipPriceEntry ? Number(vipPriceEntry.priceCdf) : priceTerrasseCdf;

                    expectedRevenueVipCdf += (priceVipCdf * item.quantity);
                }

                finalItems.push({
                    ...item,
                    productId: actualProductId,
                    isVendable,
                    unitCostCdf: itemUnitCostCdf,
                    lineTotalCdf: itemLineTotalCdf
                });
            }

            const transportFeeCdf = parseFloat(body.transportFeeCdf) || 0;
            const nonVendableTotalCdf = (Number(body.totalAmountCdf) || 0) - vendableTotalCdf - transportFeeCdf;

            const expectedProfitCdf = expectedRevenueCdf - vendableTotalCdf;
            const expectedProfitVipCdf = expectedRevenueVipCdf - vendableTotalCdf;

            // 2. Create Investment Record (CDF values as source of truth)
            const investment = await tx.investment.create({
                data: {
                    date: date ? new Date(date) : new Date(),
                    totalAmountCdf: body.totalAmountCdf || 0,
                    totalAmount: (Number(body.totalAmountCdf) || 0) / exchangeRateVal,
                    exchangeRate: exchangeRateVal,
                    source: source as FundSource,

                    vendableAmountCdf: vendableTotalCdf,
                    vendableAmount: vendableTotalCdf / exchangeRateVal,

                    nonVendableAmountCdf: nonVendableTotalCdf,
                    nonVendableAmount: nonVendableTotalCdf / exchangeRateVal,

                    transportFeeCdf: transportFeeCdf,
                    transportFee: transportFeeCdf / exchangeRateVal,

                    expectedRevenueCdf: expectedRevenueCdf,
                    expectedRevenue: expectedRevenueCdf / exchangeRateVal,

                    expectedProfitCdf: expectedProfitCdf,
                    expectedProfit: expectedProfitCdf / exchangeRateVal,

                    expectedRevenueVipCdf: expectedRevenueVipCdf,
                    expectedRevenueVip: expectedRevenueVipCdf / exchangeRateVal,

                    expectedProfitVipCdf: expectedProfitVipCdf,
                    expectedProfitVip: expectedProfitVipCdf / exchangeRateVal,

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
                        costValue: item.lineTotalCdf, // Use the calculate CDF total
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
        let { id, totalAmount, source, description, items, date, transportFee = 0 } = body;

        // Validation Fix: Accept totalAmountCdf if totalAmount is missing
        if (!totalAmount && body.totalAmountCdf) {
            const rate = parseFloat(body.exchangeRate) || 2850;
            totalAmount = Number(body.totalAmountCdf) / rate;
        }

        if (!id || (!totalAmount && !body.totalAmountCdf) || !items || items.length === 0) {
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
            let vendableTotalCdf = 0;
            let expectedRevenueCdf = 0;
            let expectedRevenueVipCdf = 0;
            let finalItems = [];

            const exchangeRateVal = parseFloat(body.exchangeRate) || 2850;

            for (const item of items) {
                let actualProductId = item.productId;
                let isVendable = item.isVendable;

                if (item.isNew && !actualProductId.startsWith("cl")) {
                    const existingProduct = await tx.product.findFirst({
                        where: {
                            name: { equals: item.productName, mode: 'insensitive' },
                            type: 'NON_VENDABLE'
                        }
                    });

                    if (existingProduct) {
                        actualProductId = existingProduct.id;
                        isVendable = existingProduct.vendable;
                    } else {
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

                        // Create cost record (CDF First)
                        const costCdf = Number(item.itemPrice);
                        await tx.productCost.create({
                            data: {
                                productId: actualProductId,
                                unitCostCdf: costCdf,
                                unitCostUsd: costCdf / exchangeRateVal,
                                forUnit: item.newUnit || "PIECE"
                            }
                        });
                    }
                }

                // Calculate item cost in CDF immediately to avoid drift
                const itemUnitCostCdf = Number(item.itemPrice);
                const itemLineTotalCdf = itemUnitCostCdf * item.quantity;

                if (isVendable) {
                    vendableTotalCdf += itemLineTotalCdf;
                    const prices = await tx.productPrice.findMany({
                        where: { productId: actualProductId },
                        include: { space: true }
                    });

                    // 1. TERRASSE/STANDARD Price (CDF)
                    const standardPriceEntry = prices.find(p => {
                        const name = p.space.name.toLowerCase().trim();
                        return name === 'terrasse' || name === 'salle' || name === 'standard';
                    });
                    const fallbackPrice = prices.find(p => !p.space.name.toLowerCase().includes('vip'));

                    const priceTerrasseCdf = standardPriceEntry
                        ? Number(standardPriceEntry.priceCdf)
                        : (fallbackPrice ? Number(fallbackPrice.priceCdf) : 0);

                    expectedRevenueCdf += (priceTerrasseCdf * item.quantity);

                    // 2. VIP Price (CDF)
                    const vipPriceEntry = prices.find(p => p.space.name.toLowerCase().includes('vip'));
                    const priceVipCdf = vipPriceEntry ? Number(vipPriceEntry.priceCdf) : priceTerrasseCdf;

                    expectedRevenueVipCdf += (priceVipCdf * item.quantity);
                }

                finalItems.push({
                    ...item,
                    productId: actualProductId,
                    isVendable,
                    unitCostCdf: itemUnitCostCdf,
                    lineTotalCdf: itemLineTotalCdf
                });
            }

            const transportFeeCdf = parseFloat(body.transportFeeCdf) || 0;
            const nonVendableTotalCdf = (Number(body.totalAmountCdf) || 0) - vendableTotalCdf - transportFeeCdf;

            const expectedProfitCdf = expectedRevenueCdf - vendableTotalCdf;
            const expectedProfitVipCdf = expectedRevenueVipCdf - vendableTotalCdf;

            // 4. Update Investment Record
            const investment = await tx.investment.update({
                where: { id },
                data: {
                    date: date ? new Date(date) : undefined,
                    totalAmountCdf: body.totalAmountCdf || 0,
                    totalAmount: (Number(body.totalAmountCdf) || 0) / exchangeRateVal,
                    exchangeRate: exchangeRateVal,
                    source: source as FundSource,

                    vendableAmountCdf: vendableTotalCdf,
                    vendableAmount: vendableTotalCdf / exchangeRateVal,

                    nonVendableAmountCdf: nonVendableTotalCdf,
                    nonVendableAmount: nonVendableTotalCdf / exchangeRateVal,

                    transportFeeCdf: transportFeeCdf,
                    transportFee: transportFeeCdf / exchangeRateVal,

                    expectedRevenueCdf: expectedRevenueCdf,
                    expectedRevenue: expectedRevenueCdf / exchangeRateVal,

                    expectedProfitCdf: expectedProfitCdf,
                    expectedProfit: expectedProfitCdf / exchangeRateVal,

                    expectedRevenueVipCdf: expectedRevenueVipCdf,
                    expectedRevenueVip: expectedRevenueVipCdf / exchangeRateVal,

                    expectedProfitVipCdf: expectedProfitVipCdf,
                    expectedProfitVip: expectedProfitVipCdf / exchangeRateVal,

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
                        costValue: item.lineTotalCdf,
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

// DELETE: Delete Investment + Reverse Stock
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Investment ID required" }, { status: 400 });
        }

        // Check if exists first to avoid 500
        const existing = await prisma.investment.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Investment not found" }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            // 1. Get movements to reverse
            const movements = await tx.stockMovement.findMany({
                where: { investmentId: id }
            });

            // 2. Reverse Stock
            for (const mov of movements) {
                if (mov.type === "IN" && mov.toLocation) {
                    await tx.stockItem.upsert({
                        where: { productId_location: { productId: mov.productId, location: mov.toLocation } },
                        update: { quantity: { decrement: mov.quantity } },
                        create: { productId: mov.productId, location: mov.toLocation, quantity: 0 }
                    });
                }
            }

            // 3. Delete Record (Cascade deletes movements if configured, else delete movements first)
            // Ideally schema has onDelete: Cascade, but safe to delete movements explicitly
            await tx.stockMovement.deleteMany({ where: { investmentId: id } });
            await tx.investment.delete({ where: { id } });
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Investment DELETE Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
