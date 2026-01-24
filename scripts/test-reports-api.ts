
import { prisma } from "../src/lib/prisma";

async function main() {
    try {
        console.log("Testing Reports API Logic...");

        const products = await prisma.product.findMany({
            where: { active: true },
            include: { stockItems: true, costs: true, prices: true }
        });

        const activeStockItems = await prisma.stockItem.findMany({
            where: { quantity: { gt: 0 }, product: { active: true } },
            include: { product: { include: { costs: true, prices: true } } }
        });

        console.log(`Found ${activeStockItems.length} active stock items.`);

        let totalCost = 0;
        let totalPotentialRevenue = 0;

        for (const item of activeStockItems) {
            const p = item.product;
            const costObj = p.costs.find(c => c.forUnit === p.saleUnit) || p.costs[0];
            const unitCost = costObj?.unitCostUsd?.toNumber() || 0;

            const relevantPrices = p.prices.filter(pr => pr.forUnit === p.saleUnit || !pr.forUnit);
            let avgPrice = 0;
            if (relevantPrices.length > 0) {
                const sumPrices = relevantPrices.reduce((acc, curr) => acc + curr.priceUsd.toNumber(), 0);
                avgPrice = sumPrices / relevantPrices.length;
            }

            const qty = item.quantity.toNumber();
            totalCost += qty * unitCost;
            totalPotentialRevenue += qty * avgPrice;

            if (qty > 0) {
                console.log(`- ${p.name}: Qty=${qty} Cost=$${unitCost} Price=$${avgPrice.toFixed(2)}`);
            }
        }

        console.log("------------------------------------------------");
        console.log(`TOTAL COST (Invested): $${totalCost.toFixed(2)}`);
        console.log(`POTENTIAL REV: $${totalPotentialRevenue.toFixed(2)}`);
        console.log(`POTENTIAL PROFIT: $${(totalPotentialRevenue - totalCost).toFixed(2)}`);


    } catch (e: any) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
