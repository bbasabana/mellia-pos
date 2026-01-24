import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { items, clientId, paymentMethod, totalReceived, orderType, deliveryInfo } = body;

        if (!items || items.length === 0) {
            return new NextResponse("No items in cart", { status: 400 });
        }

        // Start Transaction with increased timeout
        const result = await prisma.$transaction(async (tx) => {
            let totalBrut = 0;
            let totalCost = 0;

            // 1. Validate Stock & Calculate Totals
            const saleItemsData = [];

            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    include: { costs: true } // Need cost for margin
                });

                if (!product) {
                    throw new Error(`Product ${item.productId} not found`);
                }

                // Determine Location based on Type
                // BEVERAGE -> FRIGO, FOOD -> CUISINE (Default assumption)
                const location = product.type === "BEVERAGE" ? "FRIGO" : "CUISINE";

                // Check Stock
                const stockItem = await tx.stockItem.findUnique({
                    where: {
                        productId_location: {
                            productId: product.id,
                            location: location as any,
                        }
                    }
                });

                if (!stockItem || stockItem.quantity.toNumber() < item.quantity) {
                    throw new Error(`Stock insuffisant pour ${product.name} (Dispo: ${stockItem?.quantity || 0})`);
                }

                // Calculate line total
                const lineTotal = item.price * item.quantity;
                totalBrut += lineTotal;

                // Calculate Cost
                const costEntry = product.costs.find(c => c.forUnit === item.saleUnit) || product.costs[0];
                const unitCost = costEntry ? Number(costEntry.unitCostUsd) : 0;
                totalCost += unitCost * item.quantity;

                saleItemsData.push({
                    product,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    totalPrice: lineTotal,
                    unitCost: unitCost,
                    location: location
                });
            }

            // 2. Points Calculation
            const rate = await tx.exchangeRate.findFirst({
                where: { active: true },
                orderBy: { effectiveDate: "desc" }
            });
            const rateVal = rate ? Number(rate.rateUsdToCdf) : 2800;
            const totalCDF = totalBrut * rateVal;
            const pointsEarned = Math.floor(totalCDF / 20000);

            let pointsUsed = 0;
            if (paymentMethod === "LOYALTY_POINTS") {
                pointsUsed = Math.floor(totalBrut / 10) * 10;
            }

            // 3. Create Sale
            const ticketNum = `TK-${Date.now().toString().slice(-6)}`;

            const sale = await tx.sale.create({
                data: {
                    ticketNum,
                    userId: session.user.id,
                    clientId: clientId || null,
                    status: "COMPLETED",
                    paymentMethod: paymentMethod || "CASH",
                    orderType: orderType || "DINE_IN",
                    totalBrut: totalBrut,
                    discount: 0,
                    totalNet: totalBrut,
                    pointsEarned: clientId ? pointsEarned : 0,
                    pointsUsed: pointsUsed,
                    items: {
                        create: saleItemsData.map(i => ({
                            productId: i.product.id,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                            totalPrice: i.totalPrice,
                            unitCost: i.unitCost
                        }))
                    },
                    // Create Delivery Info if provided
                    ...(deliveryInfo && orderType === "DELIVERY" && {
                        deliveryInfo: {
                            create: {
                                address: deliveryInfo.address,
                                phone: deliveryInfo.phone,
                                instructions: deliveryInfo.instructions,
                                deliveryStatus: "PENDING"
                            }
                        }
                    }),
                    // Create Kitchen Order automatically
                    kitchenOrders: {
                        create: {
                            orderType: orderType || "DINE_IN",
                            status: "PENDING",
                            priority: 0 // Default priority
                        }
                    }
                }
            });

            // 4. Update Stock & Create Movements
            for (const i of saleItemsData) {
                // Decrease Stock
                await tx.stockItem.update({
                    where: {
                        productId_location: {
                            productId: i.product.id,
                            location: i.location as any
                        }
                    },
                    data: {
                        quantity: { decrement: i.quantity }
                    }
                });

                // Create Movement (OUT)
                await tx.stockMovement.create({
                    data: {
                        productId: i.product.id,
                        type: "OUT",
                        quantity: i.quantity,
                        fromLocation: i.location as any,
                        reason: `Vente #${sale.ticketNum}`,
                        userId: session.user.id,
                        costValue: i.unitCost * i.quantity
                    }
                });
            }

            // 5. Update Client Points
            if (clientId) {
                const pointsChange = pointsEarned - pointsUsed;
                if (pointsChange !== 0) {
                    await tx.client.update({
                        where: { id: clientId },
                        data: {
                            points: { increment: pointsChange }
                        }
                    });

                    await tx.loyaltyTransaction.create({
                        data: {
                            clientId,
                            amount: pointsChange,
                            saleId: sale.id,
                            reason: `Vente ${sale.ticketNum}`
                        }
                    });
                }
            }

            return sale;
        }, {
            maxWait: 10000, // Maximum time to wait for a transaction slot (10s)
            timeout: 20000, // Maximum time the transaction can run (20s)
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("[SALES_POST]", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Error" },
            { status: 400 }
        );
    }
}
