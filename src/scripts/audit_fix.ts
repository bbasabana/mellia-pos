import { prisma } from '../lib/prisma';

async function audit() {
    console.log("--- AUDIT START ---");
    try {
        // 1. Sale Spaces
        const spaces = await prisma.saleSpace.findMany();
        console.log("SALE SPACES:", spaces.map(s => ({ id: s.id, name: s.name })));

        // 2. Specific Products for ROI analysis
        const productNames = ['Cuisse', 'Frite', 'Makemba', 'Kwanga', 'Pain Arabe', 'Poivron', 'Oignon', 'Ndembi', 'Muscade'];
        const products = await prisma.product.findMany({
            where: { name: { in: productNames } },
            include: {
                prices: {
                    include: { space: true }
                }
            }
        });

        console.log("\nPRODUCT PRICES:");
        products.forEach(p => {
            console.log(`\nProduct: ${p.name} (${p.type})`);
            if (p.prices.length === 0) console.log("  NO PRICES FOUND");
            p.prices.forEach(pr => {
                console.log(`  - Space: ${pr.space.name.padEnd(10)} | CDF: ${pr.priceCdf} | USD: ${pr.priceUsd}`);
            });
        });

        // 3. Search for the specific investment
        // Total invested CDF: 107,404
        const targetInvestment = await prisma.investment.findFirst({
            where: {
                OR: [
                    { totalAmountCdf: 107404 },
                    { description: { contains: '8zvt99' } }
                ]
            },
            include: {
                movements: {
                    include: {
                        product: {
                            include: {
                                prices: { include: { space: true } }
                            }
                        }
                    }
                }
            }
        });

        if (targetInvestment) {
            console.log("\n--- TARGET INVESTMENT FOUND ---");
            console.log("ID:", targetInvestment.id);
            console.log("Date:", targetInvestment.date);
            console.log("Total Amount (USD):", targetInvestment.totalAmount);
            console.log("Total Amount (CDF):", targetInvestment.totalAmountCdf);
            console.log("Exchange Rate:", targetInvestment.exchangeRate);
            console.log("Transport Fee:", targetInvestment.transportFee);
            console.log("Vendable Amount:", targetInvestment.vendableAmount);
            console.log("Non-Vendable Amount:", targetInvestment.nonVendableAmount);

            console.log("\nMovements:");
            targetInvestment.movements.forEach(m => {
                console.log(`  - ${m.product.name} | Qty: ${m.quantity} | Cost Value (USD): ${m.costValue}`);
            });
        } else {
            console.log("\nTARGET INVESTMENT NOT FOUND (107404 CDF)");
        }

    } catch (error) {
        console.error("AUDIT ERROR:", error);
    }
    console.log("\n--- AUDIT END ---");
}

audit();
