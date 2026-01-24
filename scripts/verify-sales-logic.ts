
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("--- Verifying POS Sales Logic ---");

    // Setup Test Data
    console.log("Setting up test data...");

    // 1. Product & Stock
    const product = await prisma.product.create({
        data: {
            name: `Test Product ${Date.now()}`,
            type: "BEVERAGE", // -> FRIGO
            saleUnit: "BOTTLE",
            costs: {
                create: { unitCostUsd: 1.0, unitCostCdf: 2800 }
            }
        }
    });

    await prisma.stockItem.create({
        data: {
            productId: product.id,
            location: "FRIGO",
            quantity: 10
        }
    });

    // 2. Client
    const client = await prisma.client.create({
        data: {
            name: "Loyalty Tester",
            phone: `085-${Date.now()}`,
            points: 0
        }
    });

    // 3. Admin User (needed for sale)
    // Find or create admin
    let user = await prisma.user.findFirst();
    if (!user) {
        user = await prisma.user.create({
            data: {
                name: "Admin",
                email: `admin-${Date.now()}@pos.com`,
                passwordHash: "hash",
                role: "ADMIN"
            }
        });
    }

    // --- EXECUTE SALE LOGIC (Simulating API) ---
    console.log("Executing Sale...");

    const qtyToSell = 2;
    const price = 5.0; // Total 10.0

    await prisma.$transaction(async (tx) => {
        // A. Deduction
        await tx.stockItem.update({
            where: {
                productId_location: { productId: product.id, location: "FRIGO" }
            },
            data: { quantity: { decrement: qtyToSell } }
        });

        await tx.stockMovement.create({
            data: {
                productId: product.id,
                type: "OUT",
                quantity: qtyToSell,
                fromLocation: "FRIGO",
                reason: "Test Sale",
                userId: user.id
            }
        });

        // B. Sale Record
        const sale = await tx.sale.create({
            data: {
                ticketNum: `TEST-${Date.now()}`,
                userId: user.id,
                clientId: client.id,
                totalBrut: qtyToSell * price,
                totalNet: qtyToSell * price,
                paymentMethod: "CASH",
                items: {
                    create: [{
                        productId: product.id,
                        quantity: qtyToSell,
                        unitPrice: price,
                        totalPrice: qtyToSell * price,
                        unitCost: 1.0
                    }]
                }
            }
        });

        // C. Points (10$ = 28,000 FC -> / 20,000 FC ~ 1.4 points -> 1 point)
        // Let's force a rate
        const rate = 2800;
        const totalCDF = (qtyToSell * price) * rate; // 10 * 2800 = 28000
        const pointsEarned = Math.floor(totalCDF / 20000); // 1 point

        await tx.client.update({
            where: { id: client.id },
            data: { points: { increment: pointsEarned } }
        });

        console.log(`Sale Created ${sale.id}. Points Earned: ${pointsEarned}`);
    });

    // --- VERIFY RESULTS ---
    console.log("Verifying results...");

    // Check Stock
    const stock = await prisma.stockItem.findUnique({
        where: { productId_location: { productId: product.id, location: "FRIGO" } }
    });
    console.log(`Stock: Expected 8, Got ${stock?.quantity}`);
    if (Number(stock?.quantity) !== 8) throw new Error("Stock Check Failed");

    // Check Client Points
    const fetchedClient = await prisma.client.findUnique({ where: { id: client.id } });
    console.log(`Points: Expected 1, Got ${fetchedClient?.points}`);
    if (fetchedClient?.points !== 1) throw new Error("Points Check Failed");

    // Cleanup
    console.log("Cleaning up...");
    await prisma.stockItem.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.client.delete({ where: { id: client.id } });

    console.log("--- POS Verification Passed ---");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
