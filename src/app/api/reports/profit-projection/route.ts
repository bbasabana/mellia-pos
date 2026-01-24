
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Fetch all active products with their related data
        const products = await prisma.product.findMany({
            where: { active: true },
            include: {
                stockItems: true,
                costs: true,
                prices: true
            }
        });

        const activeStockItems = await prisma.stockItem.findMany({
            where: {
                quantity: { gt: 0 },
                product: { active: true }
            },
            include: {
                product: {
                    include: {
                        costs: true,
                        prices: true
                    }
                }
            }
        });

        // Aggregation Variables
        let totalCost = 0; // Total Inventory Value (Investment)
        let totalPotentialRevenue = 0; // If sold
        let details: any[] = [];

        for (const item of activeStockItems) {
            const p = item.product;

            // 1. Determine Unit Cost (Priority to unit cost, fallback to 0)
            const costObj = p.costs.find(c => c.forUnit === p.saleUnit) || p.costs[0];
            const unitCost = costObj?.unitCostUsd?.toNumber() || 0;

            // 2. Determine Avg Selling Price or Best Selling Price
            // Strategy: We use an average of all Define Prices to estimate Revenue? 
            // Or pessimistic (Lowest)? Or Optimistic (Highest)?
            // Better: Simple Average of Active Prices or just the Main price if only 1.

            // Filter prices that match the sale unit or are generic
            const relevantPrices = p.prices.filter(pr => pr.forUnit === p.saleUnit || !pr.forUnit);

            let avgPrice = 0;
            if (relevantPrices.length > 0) {
                const sumPrices = relevantPrices.reduce((acc, curr) => acc + curr.priceUsd.toNumber(), 0);
                avgPrice = sumPrices / relevantPrices.length;
            }

            const qty = item.quantity.toNumber();
            const itemTotalCost = qty * unitCost;
            const itemTotalRevenue = qty * avgPrice;
            const itemProfit = itemTotalRevenue - itemTotalCost;

            totalCost += itemTotalCost;
            totalPotentialRevenue += itemTotalRevenue;

            if (itemTotalRevenue > 0) {
                details.push({
                    name: p.name,
                    category: p.beverageCategory || p.foodCategory || "Autre",
                    quantity: qty,
                    unitCost: unitCost,
                    avgPrice: avgPrice,
                    totalCost: itemTotalCost,
                    potentialRevenue: itemTotalRevenue,
                    potentialProfit: itemProfit
                });
            }
        }

        // Sort details by highest profit potential
        details.sort((a, b) => b.potentialProfit - a.potentialProfit);

        const totalPotentialProfit = totalPotentialRevenue - totalCost;
        const globalMarginPercent = totalPotentialRevenue > 0
            ? (totalPotentialProfit / totalPotentialRevenue) * 100
            : 0;

        return NextResponse.json({
            success: true,
            data: {
                totalCost,
                totalPotentialRevenue,
                totalPotentialProfit,
                globalMarginPercent,
                details: details.slice(0, 50) // Top 50
            }
        });

    } catch (error: any) {
        console.error("Reports API Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
