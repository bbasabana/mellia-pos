
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Attempting to fetch inventory sessions with mapping...");

        // Match the API query exactly
        const sessions = await prisma.inventorySession.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } } },
            take: 20
        });

        console.log(`Fetched ${sessions.length} sessions.`);

        // Match the mapping logic exactly
        const safeSessions = sessions.map(s => {
            try {
                return {
                    ...s,
                    totalVariance: s.totalVariance ? s.totalVariance.toNumber() : null
                };
            } catch (err: any) {
                console.error(`Mapping error on session ${s.id}:`, err);
                throw err;
            }
        });

        console.log("Mapping Success. Data:", JSON.stringify(safeSessions, null, 2));

    } catch (e: any) {
        console.error("Reproduction Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
