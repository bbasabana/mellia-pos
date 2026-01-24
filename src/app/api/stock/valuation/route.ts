import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Fetch products with their stock, costs, and prices
        const products = await prisma.product.findMany({
            where: { active: true },
            include: {
                stockItems: true,
                costs: true,
                prices: {
                    include: { space: true }
                }
            }
        });

        // Calculate Valuation
        const valuationData = products.map(product => {
            // 1. Total Quantity in Stock
            const totalStock = product.stockItems.reduce((acc, item) => acc + item.quantity.toNumber(), 0);

            // 2. Unit Cost (USD)
            // Use the cost for the base unit (BOTTLE/PLATE/PIECE) if available
            const unitCost = product.costs.find(c => c.forUnit === product.saleUnit)?.unitCostUsd.toNumber() || 0;
            const totalCostValue = totalStock * unitCost;

            // 3. Potential Revenue (approximate based on average selling price)
            // We'll take an average of prices across active spaces, or max price? Average is safer estimation.
            const validPrices = product.prices.filter(p => p.priceUsd.toNumber() > 0 && p.forUnit === product.saleUnit);
            const avgPrice = validPrices.length > 0
                ? validPrices.reduce((acc, p) => acc + p.priceUsd.toNumber(), 0) / validPrices.length
                : 0;

            const maxPrice = validPrices.length > 0
                ? Math.max(...validPrices.map(p => p.priceUsd.toNumber()))
                : 0;

            const potentialRevenue = totalStock * avgPrice;
            const potentialProfit = potentialRevenue - totalCostValue;

            return {
                id: product.id,
                name: product.name,
                type: product.type,
                saleUnit: product.saleUnit,
                stock: totalStock,
                unitCost: unitCost,
                avgPrice: avgPrice,
                maxPrice: maxPrice,
                totalCostValue: totalCostValue,
                potentialRevenue: potentialRevenue,
                potentialProfit: potentialProfit
            };
        });

        // Filter out items with 0 stock to declutter report? 
        // Or keep them to show what is missing? Let's keep them if stock > 0 OR if they are active key items
        const inStockItems = valuationData.filter(i => i.stock > 0 || i.type === "BEVERAGE");

        const totals = {
            totalStockValue: inStockItems.reduce((acc, i) => acc + i.totalCostValue, 0),
            totalPotentialRevenue: inStockItems.reduce((acc, i) => acc + i.potentialRevenue, 0),
            totalPotentialProfit: inStockItems.reduce((acc, i) => acc + i.potentialProfit, 0),
        };

        return NextResponse.json({
            success: true,
            data: {
                items: inStockItems,
                totals: totals
            }
        });

    } catch (error) {
        console.error("Valuation Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
