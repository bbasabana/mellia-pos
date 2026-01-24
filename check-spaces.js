
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const spaces = await prisma.saleSpace.findMany();
        console.log('Sale Spaces:', JSON.stringify(spaces, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
