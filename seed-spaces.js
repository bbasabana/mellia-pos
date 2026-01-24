
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const vip = await prisma.saleSpace.upsert({
            where: { name: 'VIP' },
            update: {},
            create: {
                name: 'VIP',
                description: 'Espace VIP climatisé',
                active: true
            }
        });

        const terrasse = await prisma.saleSpace.upsert({
            where: { name: 'Terrasse' },
            update: {},
            create: {
                name: 'Terrasse',
                description: 'Espace Terrasse extérieur',
                active: true
            }
        });

        console.log('Seeded Spaces:', { vip, terrasse });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
