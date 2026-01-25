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
        const { items, clientId, paymentMethod, orderType, deliveryInfo, status = "COMPLETED", createdAt } = body;

        if (!items || items.length === 0) {
            return new NextResponse("No items in cart", { status: 400 });
        }

        // Handle custom date (Admin only)
        let saleDate: Date | undefined;
        if (createdAt) {
            // Only ADMIN can backdate sales
            if (session.user.role !== "ADMIN") {
                return new NextResponse("Unauthorized: Only admins can specify custom dates", { status: 403 });
            }
            saleDate = new Date(createdAt);
            // Validate date
            if (isNaN(saleDate.getTime())) {
                return new NextResponse("Invalid date format", { status: 400 });
            }
        }

        // Start Transaction with increased timeout
        const result = await prisma.$transaction(async (tx) => {
            let totalBrut = 0;
            let totalCost = 0;
            let totalCdf = 0;

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
                const location = product.type === "BEVERAGE" ? "FRIGO" : "CUISINE";

                // Check Stock (Only if COMPLETED)
                if (status === "COMPLETED") {
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
                }

                // Calculate line total
                const lineTotal = item.price * item.quantity;
                totalBrut += lineTotal;

                // Calculate CDF Total (Trust frontend priceCdf or approximate)
                // In a stricter system, we would fetch ProductPrice here.
                const priceCdf = item.priceCdf ? Number(item.priceCdf) : (item.price * 2800); // Fallback
                totalCdf += priceCdf * item.quantity;

                // Calculate Cost
                const costEntry = product.costs.find(c => c.forUnit === item.saleUnit) || product.costs[0];
                const unitCost = costEntry ? Number(costEntry.unitCostUsd) : 0;
                totalCost += unitCost * item.quantity;

                saleItemsData.push({
                    product,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    unitPriceCdf: priceCdf,
                    totalPrice: lineTotal,
                    unitCost: unitCost,
                    location: location
                });
            }

            // 2. Points Calculation (Only if COMPLETED)
            let pointsEarned = 0;
            const pointsUsed = 0; // Drafts cannot use points yet (simplification)

            if (status === "COMPLETED") {
                // Use totalCdf directly for points!
                // 1 point = 20,000 FC (example rule from code: totalCDF / 20000)
                pointsEarned = Math.floor(totalCdf / 20000);
            }

            // 3. Create Sale
            const ticketNum = `TK-${Date.now().toString().slice(-6)}`;

            const sale = await tx.sale.create({
                data: {
                    ticketNum,
                    userId: session.user.id,
                    clientId: clientId || null,
                    status: status, // DRAFT or COMPLETED
                    paymentMethod: paymentMethod || "CASH",
                    orderType: orderType || "DINE_IN",
                    totalBrut: totalBrut,
                    totalCdf: totalCdf, // Storing exact CDF
                    discount: 0,
                    totalNet: totalBrut,
                    pointsEarned: clientId ? pointsEarned : 0,
                    pointsUsed: pointsUsed,
                    ...(saleDate && { createdAt: saleDate }), // Custom date for admins
                    items: {
                        create: saleItemsData.map(i => ({
                            productId: i.product.id,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                            unitPriceCdf: i.unitPriceCdf,
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
                    // Create Kitchen Order automatically (Only if COMPLETED)
                    ...(status === "COMPLETED" && {
                        kitchenOrders: {
                            create: {
                                orderType: orderType || "DINE_IN",
                                status: "PENDING",
                                priority: 0,
                                ...(saleDate && { createdAt: saleDate }) // Match sale date
                            }
                        }
                    })
                },
                include: {
                    client: true,
                    user: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            // 4. Update Stock & Create Movements (Only if COMPLETED)
            if (status === "COMPLETED") {
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
                            costValue: i.unitCost * i.quantity,
                            ...(saleDate && { createdAt: saleDate }) // Match sale date
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
                                reason: `Vente ${sale.ticketNum}`,
                                ...(saleDate && { createdAt: saleDate }) // Match sale date
                            }
                        });
                    }
                }
            }

            return sale;
        }, {
            maxWait: 10000,
            timeout: 20000,
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
