import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { FundSource, StockLocation } from "@prisma/client";

// GET: Fetch Investment Stats & History
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 1. Get recent investments
        const investments = await prisma.investment.findMany({
            take: 20,
            orderBy: { date: 'desc' },
            include: { user: { select: { name: true } } }
        });

        // 2. Calculate Aggregates (Today, Week, Month)
        // Check performance if this gets heavy? For now it's fine.
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const todaysInvestments = await prisma.investment.aggregate({
            where: { date: { gte: startOfDay } },
            _sum: { totalAmount: true, expectedProfit: true }
        });

        return NextResponse.json({
            success: true,
            data: {
                history: investments,
                stats: {
                    todayTotal: todaysInvestments._sum.totalAmount || 0,
                    todayExpectedProfit: todaysInvestments._sum.expectedProfit || 0
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
            // First, calculate totals
            // Simplified logic: We assume the UI sends correct totals or we calculate them here.
            // Let's iterate items to calculate split.

            for (const item of items) {
                if (item.isVendable) {
                    vendableTotal += (item.cost * item.quantity);
                }
            }

            const nonVendableTotal = Number(totalAmount) - vendableTotal;

            // 1. Create Investment Record
            const investment = await tx.investment.create({
                data: {
                    totalAmount: totalAmount,
                    source: source as FundSource,
                    vendableAmount: vendableTotal,
                    nonVendableAmount: nonVendableTotal,
                    // TODO: Calculate real expected revenue based on prices. 
                    // For now, we set 0 or rely on frontend? Ideally backend.
                    expectedRevenue: 0, // Placeholder
                    expectedProfit: 0,  // Placeholder
                    description,
                    userId: session.user.id
                }
            });

            // 2. Process Items
            for (const item of items) {
                // Decide Location based on Type/Category?
                // PRD says: Dry -> Economat, Drinks -> Depot usually.
                // We'll require location in the payload or default to DEPOT.
                const targetLocation = item.location || "DEPOT";

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
                    update: { quantity: { increment: item.quantity } },
                    create: {
                        productId: item.productId,
                        location: targetLocation,
                        quantity: item.quantity
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
