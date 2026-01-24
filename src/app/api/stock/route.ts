import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// GET: Fetch all stock items grouped by product (Matrix View)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Fetch products with their stock items
        const products = await prisma.product.findMany({
            where: { active: true },
            include: {
                stockItems: true,
                costs: true // To calculate value
            },
            orderBy: { name: 'asc' }
        });

        // Transform into a matrix format for the UI
        const stockMatrix = products.map(p => {
            try {
                const depot = p.stockItems.find(i => i.location === "DEPOT")?.quantity.toNumber() || 0;
                const frigo = p.stockItems.find(i => i.location === "FRIGO")?.quantity.toNumber() || 0;
                const casier = p.stockItems.find(i => i.location === "CASIER")?.quantity.toNumber() || 0;
                const economat = p.stockItems.find(i => i.location === "ECONOMAT")?.quantity.toNumber() || 0;
                const cuisine = p.stockItems.find(i => i.location === "CUISINE")?.quantity.toNumber() || 0;

                const total = depot + frigo + casier + economat + cuisine;

                // Calculate value (using USD cost as base)
                // Safe access with optional chaining and fallback
                const costObj = p.costs?.find(c => c.forUnit === p.saleUnit);
                const unitCost = costObj?.unitCostUsd?.toNumber() || 0;

                const totalValue = total * unitCost;

                return {
                    id: p.id,
                    name: p.name,
                    type: p.type,
                    unit: p.saleUnit,
                    locations: {
                        DEPOT: depot,
                        FRIGO: frigo,
                        CASIER: casier,
                        ECONOMAT: economat,
                        CUISINE: cuisine
                    },
                    totalQuantity: total,
                    unitCost: unitCost,
                    totalValue: totalValue
                };
            } catch (e: any) {
                console.error(`Error processing product ${p.name} (${p.id}):`, e.message);
                // Return a safe fallback object instead of crashing everything
                return {
                    id: p.id,
                    name: p.name,
                    type: p.type,
                    unit: p.saleUnit,
                    locations: {},
                    totalQuantity: 0,
                    unitCost: 0,
                    totalValue: 0,
                    error: "Data error"
                };
            }
        });

        return NextResponse.json({ success: true, data: stockMatrix });
    } catch (error: any) {
        console.error("Stock GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}

// POST: Create a Stock Movement (Transfer, Loss, Adjustment)
// Note: Purchases are handled via /api/investments
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { productId, type, quantity, fromLocation, toLocation, reason } = body;

        // Validation
        if (!productId || !type || !quantity) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
        }

        // Transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create StockMovement Log
            const movement = await tx.stockMovement.create({
                data: {
                    productId,
                    type,
                    quantity: qty,
                    fromLocation: fromLocation || null,
                    toLocation: toLocation || null,
                    reason,
                    userId: session.user.id,
                }
            });

            // 2. Update StockItems based on logic
            // A. OUT / LOSS / TRANSFER (Decrement From)
            if (fromLocation) {
                const currentStock = await tx.stockItem.findUnique({
                    where: { productId_location: { productId, location: fromLocation } }
                });

                if (!currentStock || currentStock.quantity.toNumber() < qty) {
                    throw new Error(`Insufficient stock in ${fromLocation}`);
                }

                await tx.stockItem.update({
                    where: { productId_location: { productId, location: fromLocation } },
                    data: { quantity: { decrement: qty } }
                });
            }

            // B. IN / TRANSFER (Increment To)
            if (toLocation) {
                await tx.stockItem.upsert({
                    where: { productId_location: { productId, location: toLocation } },
                    update: { quantity: { increment: qty } },
                    create: {
                        productId,
                        location: toLocation,
                        quantity: qty
                    }
                });
            }

            return movement;
        });

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error("Stock POST Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
