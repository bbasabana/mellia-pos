
import { prisma } from "../src/lib/prisma";

async function main() {
    try {
        console.log("Testing connection to SaleSpace...");
        const spaces = await prisma.saleSpace.findMany();
        console.log(`Successfully connected. Found ${spaces.length} sale spaces.`);
    } catch (e: any) {
        console.error("Connection failed:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
