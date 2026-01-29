
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const vendables = ["Frite", "Cuisse", "Makemba", "Kwanga"];
    const nonVendables = ["Pain Arabe", "Poivron".toUpperCase(), "Oignon", "Ndembi", "Muscade"];

    console.log("--- VENDABLE CHECK ---");
    for (const name of vendables) {
        const products = await prisma.product.findMany({
            where: { name: { contains: name, mode: 'insensitive' } },
            include: { prices: { include: { space: true } } }
        });

        if (products.length === 0) {
            console.log(`❌ Product not found: ${name}`);
            continue;
        }

        for (const p of products) {
            console.log(`Product: ${p.name} (ID: ${p.id})`);
            p.prices.forEach(pr => {
                console.log(`   - Space: ${pr.space.name.padEnd(10)} | USD: ${pr.priceUsd} | CDF: ${pr.priceCdf}`);
            });
        }
    }

    console.log("\n--- NON-VENDABLE CHECK ---");
    for (const name of nonVendables) {
        const products = await prisma.product.findMany({
            where: { name: { contains: name, mode: 'insensitive' } }
        });
        if (products.length === 0) {
            console.log(`❌ Product not found: ${name}`);
            continue;
        }
        for (const p of products) {
            console.log(`Product: ${p.name} | Type: ${p.type} | Vendable: ${p.vendable} (Should be false/NON_VENDABLE)`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
