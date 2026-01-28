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

                    // ROI Logic: Get selling price
                    const prices = await tx.productPrice.findMany({
                        where: { productId: actualProductId }
                    });

                    // Use highest price found (or default to 0 if none)
                    const sellingPrice = prices.length > 0
                        ? Math.max(...prices.map(p => Number(p.priceUsd)))
                        : 0;

                    expectedRevenue += (sellingPrice * item.quantity);
                }

                finalItems.push({
                    ...item,
                    productId: actualProductId,
                    isVendable
                });
            }

            const nonVendableTotal = Number(totalAmount) - vendableTotal;
            const expectedProfit = expectedRevenue - vendableTotal;

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

// DELETE: Delete Investment + Reverse Stock
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get all movements for this investment
            const movements = await tx.stockMovement.findMany({
                where: { investmentId: id }
            });

            // 2. Reverse stock changes
            for (const mov of movements) {
                if (mov.type === "IN" && mov.toLocation) {
                    await tx.stockItem.updateMany({
                        where: {
                            productId: mov.productId,
                            location: mov.toLocation
                        },
                        data: {
                            quantity: { decrement: mov.quantity }
                        }
                    });
                }
            }

            // 3. Delete movements
            await tx.stockMovement.deleteMany({
                where: { investmentId: id }
            });

            // 4. Delete investment
            const deleted = await tx.investment.delete({
                where: { id }
            });

            return deleted;
        });

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        console.error("Investment DELETE Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
