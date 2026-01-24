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

        const skip = (page - 1) * limit;

        const where: Prisma.SaleWhereInput = {
            status: "COMPLETED",
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

// ... (previous imports)

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !["ADMIN", "MANAGER"].includes((session.user as any).role)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return new NextResponse("Missing ID", { status: 400 });
        }

        const body = await req.json();
        const { items: incomingItems } = body; // List of items with new quantities

        if (!incomingItems || !Array.isArray(incomingItems)) {
            return new NextResponse("Invalid Data", { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch current sale
            const sale = await tx.sale.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!sale) throw new Error("Sale not found");
            if (sale.status === "CANCELLED") throw new Error("Cannot edit cancelled sale");

            let newTotal = 0;

            // 2. Process Incoming Items (Updates & Adds)
            for (const item of incomingItems) {
                const existingItem = sale.items.find((i) => i.productId === item.productId);
                const quantity = Number(item.quantity);
                const price = Number(item.unitPrice);

                if (existingItem) {
                    // UPDATE Logic
                    const oldQuantity = Number(existingItem.quantity);
                    const diff = quantity - oldQuantity;

                    if (diff !== 0) {
                        // Stock Check/Update
                        const product = await tx.product.findUnique({ where: { id: item.productId } });
                        const location = product?.type === "BEVERAGE" ? "FRIGO" : "CUISINE";

                        if (diff > 0) {
                            // Buying MORE -> Deduct Stock
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
                        } else {
                            // Buying LESS -> Return to Stock
                            await tx.stockItem.update({
                                where: { productId_location: { productId: item.productId, location: location as any } },
                                data: { quantity: { increment: Math.abs(diff) } }
                            });
                        }

                        // Record Movement
                        await tx.stockMovement.create({
                            data: {
                                productId: item.productId,
                                type: "ADJUSTMENT",
                                quantity: new Prisma.Decimal(Math.abs(diff)),
                                // if diff > 0 (bought more) -> OUT (or just ADJUSTMENT implied)
                                // if diff < 0 (bought less) -> IN
                                fromLocation: diff > 0 ? location : undefined,
                                toLocation: diff < 0 ? location : undefined,
                                reason: `Modification Vente #${sale.ticketNum}`,
                                userId: session.user.id
                            }
                        });

                        // Update Sale Item
                        await tx.saleItem.update({
                            where: { id: existingItem.id },
                            data: {
                                quantity: quantity,
                                totalPrice: quantity * price
                            }
                        });
                    }
                } else {
                    // NEW ITEM (Not supported by UI yet but good for safety)
                    // Skip for now or throw error
                }

                newTotal += quantity * price;
            }

            // 3. Process Removed Items
            const incomingIds = incomingItems.map((i: any) => i.productId);
            const removedItems = sale.items.filter((i) => !incomingIds.includes(i.productId));

            for (const item of removedItems) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                const location = product?.type === "BEVERAGE" ? "FRIGO" : "CUISINE";

                // Restore Stock
                await tx.stockItem.update({
                    where: { productId_location: { productId: item.productId, location: location as any } },
                    data: { quantity: { increment: item.quantity } }
                });

                // Record Movement
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: "ADJUSTMENT",
                        quantity: item.quantity,
                        toLocation: location as any,
                        reason: `Retrait produit Vente #${sale.ticketNum}`,
                        userId: session.user.id
                    }
                });

                // Delete Item
                await tx.saleItem.delete({ where: { id: item.id } });
            }

            // 4. Update Sale Totals
            // Recalculate DISCOUNT if it was percentage? For now assume fixed or re-calc
            // Simple logic: New Total Net = New Total Items (assuming no discount change logic provided)

            return await tx.sale.update({
                where: { id },
                data: {
                    totalBrut: newTotal,
                    totalNet: newTotal - Number(sale.discount), // Keep same discount value
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
