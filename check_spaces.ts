
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const spaces = await prisma.saleSpace.findMany();
    console.log('Sale Spaces:', spaces);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
