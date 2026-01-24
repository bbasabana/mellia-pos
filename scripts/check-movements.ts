
import { prisma } from "../src/lib/prisma";

async function main() {
    const movements = await prisma.stockMovement.findMany({
        where: { type: "OUT" }
    });
    console.log(`Found ${movements.length} OUT movements.`);
}
main();
