
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing Prisma connection...');

    try {
        console.log('Fetching ProductTypeMetadata...');
        const types = await prisma.productTypeMetadata.findMany();
        console.log('Types found:', types);

        console.log('Fetching CategoryMetadata...');
        const categories = await prisma.categoryMetadata.findMany();
        console.log('Categories found:', categories);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
