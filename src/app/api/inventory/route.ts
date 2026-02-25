import { NextResponse } from "next/server";
import { prisma, prismaUnpooled } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// GET: List Inventory Sessions
// GET: List Inventory Sessions
export async function GET() {
    try {
        console.log("🔍 [API] GET /api/inventory - Starting request");

        const session = await getServerSession(authOptions);
        console.log("👤 [API] Session:", session ? "Authenticated" : "No Session");

        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        console.log("📦 [API] Fetching inventory sessions...");
        const sessions = await prisma.inventorySession.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } } },
            take: 20
        });
        console.log(`📦 [API] Fetched ${sessions.length} sessions`);

        const safeSessions = sessions.map(s => {
            try {
                return {
                    ...s,
                    totalVariance: s.totalVariance ? s.totalVariance.toNumber() : null
                };
            } catch (e) {
                console.error(`❌ [API] Error mapping session ${s.id}:`, e);
                return s; // Fallback or handle appropriately
            }
        });
        console.log("✅ [API] Data processed successfully");

        return NextResponse.json({ success: true, data: safeSessions });
    } catch (error: any) {
        console.error("❌ [API] Inventory GET Error CRITICAL:", error);
        // Return detailed error to the client for debugging
        return NextResponse.json({
            error: "Internal Server Error",
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}

// POST: Start a new Inventory Session
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Check if there is already an open session
        const openSession = await prisma.inventorySession.findFirst({
            where: { status: "OPEN" }
        });

        if (openSession) {
            return NextResponse.json({
                success: true,
                data: openSession,
                message: "Session already open"
            });
        }

        // Create new session
        // We will populate items dynamically when fetching usually, 
        // OR we can snapshot expected quantities now.
        // Let's snapshot now to freeze the "Theoretical" state.

        const products = await prisma.product.findMany({
            where: { active: true },
            include: { stockItems: true }
        });

        const newSession = await prisma.inventorySession.create({
            data: {
                userId: session.user.id,
                status: "OPEN"
            }
        });

        // Create Inventory Items for every product location that exists
        // simplified: we create rows for existing stock items
        const itemCreates = [];
        for (const p of products) {
            for (const stock of p.stockItems) {
                if (stock.quantity.toNumber() > 0) {
                    itemCreates.push({
                        sessionId: newSession.id,
                        productId: p.id,
                        location: stock.location,
                        expectedQuantity: stock.quantity,
                        actualQuantity: 0, // To be filled
                        variance: 0
                    });
                }
            }
        }

        if (itemCreates.length > 0) {
            await prisma.inventoryItem.createMany({ data: itemCreates });
        }

        return NextResponse.json({ success: true, data: newSession });

    } catch (error) {
        console.error("Inventory POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: Close Session / Submit Counts
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { sessionId, counts } = body; // counts = [{ productId, location, actualQuantity }]

        if (!sessionId || !counts) return NextResponse.json({ error: "Missing data" }, { status: 400 });

        // Calculate Variance and Update
        const result = await prismaUnpooled.$transaction(async (tx) => {
            let totalVarianceValue = 0;

            for (const count of counts) {
                const item = await tx.inventoryItem.findFirst({
                    where: { sessionId, productId: count.productId, location: count.location }
                });

                // If item exists in snapshot
                if (item) {
                    const variance = count.actualQuantity - item.expectedQuantity.toNumber();

                    await tx.inventoryItem.update({
                        where: { id: item.id },
                        data: {
                            actualQuantity: count.actualQuantity,
                            variance: variance
                        }
                    });

                    // If Variance < 0 (LOSS), create a StockMovement
                    if (variance < 0) {
                        await tx.stockMovement.create({
                            data: {
                                productId: count.productId,
                                type: "LOSS",
                                quantity: Math.abs(variance),
                                fromLocation: count.location,
                                reason: `Perte Inventaire #${sessionId.slice(-4)}`,
                                userId: session.user.id
                            }
                        });

                        // Update real stock to match reality
                        await tx.stockItem.update({
                            where: { productId_location: { productId: count.productId, location: count.location } },
                            data: { quantity: count.actualQuantity }
                        });
                    }

                    // If Variance > 0 (Found Stock), Adjustment
                    if (variance > 0) {
                        await tx.stockMovement.create({
                            data: {
                                productId: count.productId,
                                type: "ADJUSTMENT",
                                quantity: variance,
                                toLocation: count.location,
                                reason: `Surplus Inventaire #${sessionId.slice(-4)}`,
                                userId: session.user.id
                            }
                        });
                        await tx.stockItem.update({
                            where: { productId_location: { productId: count.productId, location: count.location } },
                            data: { quantity: count.actualQuantity }
                        });
                    }
                }
            }

            // Close Session
            const closedSession = await tx.inventorySession.update({
                where: { id: sessionId },
                data: { status: "CLOSED", totalVariance: totalVarianceValue }
            });

            return closedSession;
        });

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        console.error("Inventory PUT Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
