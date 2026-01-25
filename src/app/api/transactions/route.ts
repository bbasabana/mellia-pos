import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const query = searchParams.get("query") || "";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const status = searchParams.get("status") || "COMPLETED"; // Default to COMPLETED

        const skip = (page - 1) * limit;

        const where: Prisma.SaleWhereInput = {
            status: status as any,
        };

        if (query) {
            where.OR = [
                { ticketNum: { contains: query, mode: "insensitive" } },
                { client: { name: { contains: query, mode: "insensitive" } } },
            ];
        }

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
            };
        } else if (startDate) {
            where.createdAt = {
                gte: new Date(startDate),
            };
        }

        const [sales, total] = await Promise.all([
            prisma.sale.findMany({
                where,
                include: {
                    client: true,
                    user: true, // Cashier
                    items: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.sale.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: sales,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return new NextResponse("Missing ID", { status: 400 });
        }

        const body = await req.json();
        const { items: incomingItems, status: newStatus, paymentMethod, paymentReference } = body; // List of items with new quantities

        const result = await prisma.$transaction(async (tx) => {
            // Get rate for fallback
            const rateObj = await tx.exchangeRate.findFirst({ where: { active: true }, orderBy: { effectiveDate: "desc" } });
            const rate = rateObj ? Number(rateObj.rateUsdToCdf) : 2800;

            // 1. Fetch current sale
            const sale = await tx.sale.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!sale) throw new Error("Sale not found");
            if (sale.status === "CANCELLED") throw new Error("Cannot edit cancelled sale");

            const isDraft = sale.status === "DRAFT";
            const isFinalizing = isDraft && newStatus === "COMPLETED";

            let newTotal = 0;
            let newTotalCdf = 0;

            // 2. Process Items (Update SaleItems in DB)
            if (incomingItems && Array.isArray(incomingItems)) {
                for (const item of incomingItems) {
                    const existingItem = sale.items.find((i) => i.productId === item.productId);
                    const quantity = Number(item.quantity);
                    const price = Number(item.unitPrice);
                    // Use passed unitPriceCdf (rounded) or fallback (rounded)
                    const priceCdf = Math.round(item.unitPriceCdf ? Number(item.unitPriceCdf) : (price * rate));

                    if (existingItem) {
                        // UPDATE Existing Item
                        const diff = quantity - Number(existingItem.quantity);

                        // If already COMPLETED, handle stock adjustments immediately
                        if (!isDraft && diff !== 0) {
                            const product = await tx.product.findUnique({ where: { id: item.productId } });
                            const location = product?.type === "BEVERAGE" ? "FRIGO" : "CUISINE";

                            if (diff > 0) { // Bought MORE
                                const stockItem = await tx.stockItem.findUnique({
                                    where: { productId_location: { productId: item.productId, location: location as any } }
                                });
                                if (!stockItem || Number(stockItem.quantity) < diff) {
                                    throw new Error(`Stock insuffisant pour ${product?.name}`);
                                }
                                await tx.stockItem.update({
                                    where: { productId_location: { productId: item.productId, location: location as any } },
                                    data: { quantity: { decrement: diff } }
                                });
                                // OUT movement implied
                                await tx.stockMovement.create({
                                    data: {
                                        productId: item.productId,
                                        type: "ADJUSTMENT",
                                        quantity: new Prisma.Decimal(diff),
                                        fromLocation: location as any,
                                        reason: `Modif Vente #${sale.ticketNum}`,
                                        userId: (session.user as any).id
                                    }
                                });
                            } else { // Bought LESS
                                await tx.stockItem.update({
                                    where: { productId_location: { productId: item.productId, location: location as any } },
                                    data: { quantity: { increment: Math.abs(diff) } }
                                });
                                // IN movement implied
                                await tx.stockMovement.create({
                                    data: {
                                        productId: item.productId,
                                        type: "ADJUSTMENT",
                                        quantity: new Prisma.Decimal(Math.abs(diff)),
                                        toLocation: location as any,
                                        reason: `Modif Vente #${sale.ticketNum}`,
                                        userId: (session.user as any).id
                                    }
                                });
                            }
                        }

                        // Just update SaleItem
                        await tx.saleItem.update({
                            where: { id: existingItem.id },
                            data: {
                                quantity: quantity,
                                unitPrice: price, // Allow price updates
                                unitPriceCdf: priceCdf,
                                totalPrice: quantity * price
                            }
                        });


                    } else {
                        // NEW ITEM (Safe to add for Drafts, but needs safety for Completed)
                        // If COMPLETED, we need to check/deduct stock
                        if (!isDraft) {
                            const product = await tx.product.findUnique({ where: { id: item.productId } });
                            const location = product?.type === "BEVERAGE" ? "FRIGO" : "CUISINE";

                            // Check stock
                            const stockItem = await tx.stockItem.findUnique({
                                where: { productId_location: { productId: item.productId, location: location as any } }
                            });
                            if (!stockItem || Number(stockItem.quantity) < quantity) {
                                throw new Error(`Stock insuffisant pour ${product?.name}`);
                            }
                            // Deduct
                            await tx.stockItem.update({
                                where: { productId_location: { productId: item.productId, location: location as any } },
                                data: { quantity: { decrement: quantity } }
                            });
                            // Movement
                            await tx.stockMovement.create({
                                data: {
                                    productId: item.productId,
                                    type: "OUT",
                                    quantity: new Prisma.Decimal(quantity),
                                    fromLocation: location as any,
                                    reason: `Ajout Vente #${sale.ticketNum}`,
                                    userId: session.user.id
                                }
                            });
                        }

                        await tx.saleItem.create({
                            data: {
                                saleId: sale.id,
                                productId: item.productId,
                                quantity: quantity,
                                unitPrice: price,
                                unitPriceCdf: priceCdf,
                                totalPrice: quantity * price,
                                unitCost: 0 // Should fetch cost ideally
                            }
                        });
                    }
                    newTotal += quantity * price;
                    newTotalCdf += quantity * priceCdf;
                }

                // Handle Removed Items
                const incomingIds = incomingItems.map((i: any) => i.productId);
                const removedItems = sale.items.filter((i) => !incomingIds.includes(i.productId));

                for (const item of removedItems) {
                    if (!isDraft) {
                        // Restore stock if it was COMPLETED
                        const product = await tx.product.findUnique({ where: { id: item.productId } });
                        const location = product?.type === "BEVERAGE" ? "FRIGO" : "CUISINE";
                        await tx.stockItem.update({
                            where: { productId_location: { productId: item.productId, location: location as any } },
                            data: { quantity: { increment: item.quantity } }
                        });
                        await tx.stockMovement.create({
                            data: {
                                productId: item.productId,
                                type: "ADJUSTMENT",
                                quantity: item.quantity,
                                toLocation: location as any,
                                reason: `Retrait Vente #${sale.ticketNum}`,
                                userId: session.user.id
                            }
                        });
                    }
                    await tx.saleItem.delete({ where: { id: item.id } });
                }
            }


            // 3. IF FINALIZING (DRAFT -> COMPLETED)
            // Now we must deduct stock for ALL items currently in the sale
            // Because they were never deducted before.
            if (isFinalizing) {
                // Fetch fresh items (after updates above)
                const updatedSale = await tx.sale.findUnique({ where: { id }, include: { items: true } });

                for (const item of updatedSale?.items || []) {
                    const product = await tx.product.findUnique({ where: { id: item.productId }, include: { costs: true } });
                    const location = product?.type === "BEVERAGE" ? "FRIGO" : "CUISINE";

                    // Check Stock
                    const stockItem = await tx.stockItem.findUnique({
                        where: { productId_location: { productId: item.productId, location: location as any } }
                    });
                    if (!stockItem || Number(stockItem.quantity) < Number(item.quantity)) {
                        throw new Error(`Stock insuffisant pour ${product?.name} lors de la validation`);
                    }

                    // Deduct
                    await tx.stockItem.update({
                        where: { productId_location: { productId: item.productId, location: location as any } },
                        data: { quantity: { decrement: item.quantity } }
                    });

                    // Movement
                    const costEntry = product?.costs.find(c => c.forUnit === product.saleUnit) || product?.costs[0];
                    const unitCost = costEntry ? Number(costEntry.unitCostUsd) : 0;

                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            type: "OUT",
                            quantity: item.quantity,
                            fromLocation: location as any,
                            reason: `Validation Vente #${sale.ticketNum}`,
                            userId: session.user.id,
                            costValue: unitCost * Number(item.quantity)
                        }
                    });
                }

                // Points Logic
                const pointsEarned = Math.floor(newTotalCdf / 20000);

                await tx.sale.update({
                    where: { id },
                    data: { pointsEarned: pointsEarned }
                });

                if (sale.clientId) {
                    await tx.client.update({
                        where: { id: sale.clientId },
                        data: { points: { increment: pointsEarned } }
                    });
                    await tx.loyaltyTransaction.create({
                        data: {
                            clientId: sale.clientId,
                            amount: pointsEarned,
                            saleId: sale.id,
                            reason: `Vente ${sale.ticketNum}`
                        }
                    });
                }

                // Create Kitchen Orders (since they were skipped in Draft)
                await tx.kitchenOrder.create({
                    data: {
                        saleId: sale.id,
                        orderType: sale.orderType,
                        status: "PENDING",
                        priority: 0
                    }
                });

                // Create Financial Transaction
                await tx.financialTransaction.create({
                    data: {
                        saleId: sale.id,
                        amount: newTotal,
                        amountCdf: newTotalCdf,
                        paymentMethod: (paymentMethod as any) || "CASH",
                        reference: paymentReference || null,
                        userId: session.user.id
                    }
                });
            }

            // 4. Update Sale Header (Totals & Status)
            return await tx.sale.update({
                where: { id },
                data: {
                    totalBrut: newTotal > 0 ? newTotal : undefined,
                    totalNet: newTotal > 0 ? newTotal : undefined,
                    totalCdf: newTotalCdf > 0 ? Math.round(newTotalCdf) : undefined, // Round total CDF to integer
                    status: newStatus || undefined, // Update status if provided (DRAFT -> COMPLETED)
                    updatedAt: new Date()
                }
            });
        });

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error("Update error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return new NextResponse("Missing ID", { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Sale with items
            const sale = await tx.sale.findUnique({
                where: { id },
                include: { items: true, client: true }
            });

            if (!sale) throw new Error("Sale not found");
            if (sale.status === "CANCELLED") throw new Error("Sale already cancelled");

            // 2. Restore Stock
            for (const item of sale.items) {
                // Determine location logic (same as create)
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                const location = product?.type === "BEVERAGE" ? "FRIGO" : "CUISINE";

                // Increment Stock
                await tx.stockItem.update({
                    where: {
                        productId_location: {
                            productId: item.productId,
                            location: location as any
                        }
                    },
                    data: {
                        quantity: { increment: item.quantity }
                    }
                });

                // Create Adjustment Movement
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: "ADJUSTMENT",
                        quantity: item.quantity,
                        toLocation: location as any,
                        reason: `Annulation Vente #${sale.ticketNum}`,
                        userId: session.user.id
                    }
                });
            }

            // 3. Revert Loyalty Points if applicable
            if (sale.clientId) {
                const pointsChange = sale.pointsEarned - sale.pointsUsed;
                // If user earned 10 points, we remove 10. If used 10, we add 10 back.
                // pointsChange was +10 (earned), so we decrement 10.
                if (pointsChange !== 0) {
                    await tx.client.update({
                        where: { id: sale.clientId },
                        data: {
                            points: { decrement: pointsChange }
                        }
                    });

                    await tx.loyaltyTransaction.create({
                        data: {
                            clientId: sale.clientId,
                            amount: -pointsChange, // Reverse effect
                            saleId: sale.id,
                            reason: `Annulation Vente #${sale.ticketNum}`
                        }
                    });
                }
            }

            // 4. Mark Sale as CANCELLED
            return await tx.sale.update({
                where: { id },
                data: {
                    status: "CANCELLED",
                    updatedAt: new Date()
                }
            });
        });

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error("Delete error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
