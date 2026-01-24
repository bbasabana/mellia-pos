
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("--- Exchange Rates ---");
    const rates = await prisma.exchangeRate.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
    console.log(JSON.stringify(rates, null, 2));

    console.log("\n--- Sample Product Prices (Limit 10) ---");
    const prices = await prisma.productPrice.findMany({
        take: 10,
        include: { product: { select: { name: true } }, space: { select: { name: true } } }
    });
    console.log(JSON.stringify(prices, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
