
// @ts-nocheck
import { prisma } from "../lib/prisma";

async function reproduceBug() {
    console.log("🚀 Starting Reproduction of Purchase Edit Bug...");

    // 1. Setup: Create a "Coca" product (Non-Vendable for simplicity or Vendable, matching the prompt)
    // Using a vendable product as in the prompt "Coca"
    const product = await prisma.product.upsert({
        where: { id: "test-coca-repro" },
        update: {},
        create: {
            id: "test-coca-repro",
            name: "Coca Test Repro",
            type: "BEVERAGE",
            saleUnit: "BOTTLE",
            purchaseUnit: "CASIER",
            packingQuantity: 24,
            active: true,
            vendable: true
        }
    });

    console.log(`\n📦 Product Created: ${product.name} (1 ${product.purchaseUnit} = ${product.packingQuantity} ${product.saleUnit})`);

    // 2. Scenario: "0.5 Casier"
    // User Input: 0.5 Casier
    // Unit Price Input: 35,000 FC / Casier
    // Expected Total: 17,500 FC
    // Actual Qty stored: 0.5 * 24 = 12 Bottles

    // In the frontend, the user types this. The payload sent to API uses CDF itemPrice derived from this.
    // itemPrice (per bottle) = 35,000 / 24 = 1458.3333...

    const inputPackQty = 0.5;
    const inputPackPrice = 35000;
    const expectedTotal = inputPackQty * inputPackPrice; // 17,500
    const calcUnitCost = expectedTotal / (inputPackQty * product.packingQuantity!); // 17500 / 12 = 1458.333...

    console.log(`\n📝 Scenario Input:`);
    console.log(`   - Qty: ${inputPackQty} ${product.purchaseUnit} (Total ${inputPackQty * product.packingQuantity!} ${product.saleUnit})`);
    console.log(`   - Price: ${inputPackPrice} FC / ${product.purchaseUnit}`);
    console.log(`   - Expected Total: ${expectedTotal} FC`);
    console.log(`   - Calculated Unit Cost (sent to DB): ${calcUnitCost} FC`);

    // 3. Create Investment (simulate API POST)
    // Cleaning up previous run
    await prisma.stockMovement.deleteMany({ where: { reason: { contains: "REPRO_BUG" } } });
    await prisma.investment.deleteMany({ where: { description: { contains: "REPRO_BUG" } } });

    const investment = await prisma.investment.create({
        data: {
            date: new Date(),
            source: "OWNER_CAPITAL",
            totalAmountCdf: expectedTotal,
            totalAmount: expectedTotal / 2850,
            exchangeRate: 2850,
            description: "REPRO_BUG: Test 0.5 Casier",
            userId: "user_test", // Assuming exists or will fail, need valid user. simplified for script.
            // We need a user. Let's find one.
            user: {
                connectOrCreate: {
                    where: { email: "test@repro.com" },
                    create: { email: "test@repro.com", name: "Tester", passwordHash: "x" }
                }
            },
            movements: {
                create: {
                    productId: product.id,
                    type: "IN",
                    quantity: inputPackQty * product.packingQuantity!, // 12
                    costValue: expectedTotal, // 17500
                    toLocation: "DEPOT",
                    reason: "REPRO_BUG",
                    // We need to connect user
                    user: { connect: { email: "test@repro.com" } }
                }
            }
        },
        include: { movements: true }
    });

    console.log(`\n💾 Saved to DB (Investment ID: ${investment.id})`);
    console.log(`   - DB TotalAmountCdf: ${investment.totalAmountCdf}`);
    console.log(`   - DB Movement Quantity: ${investment.movements[0].quantity}`);
    console.log(`   - DB Movement CostValue: ${investment.movements[0].costValue}`);

    // 4. Simulate "Edit Load" Logic from InvestmentForm.tsx
    // Logic: 
    // const lineTotalCdf = Number(mov.costValueCdf || (Number(mov.costValue || 0) * invRate));
    // const unitCostCdf = lineTotalCdf / Number(mov.quantity);

    // In DB, costValue is 17500 (Decimal).
    const dbCostValue = Number(investment.movements[0].costValue);
    const dbQty = Number(investment.movements[0].quantity); // 12

    const loadedUnitCostCdf = dbCostValue / dbQty; // 17500 / 12 = 1458.3333333333333

    // Frontend Display Logic:
    // If packQty > 1 (which it is, 24):
    // displayPrice = unitCostCdf * packQty
    const loadedDisplayPrice = loadedUnitCostCdf * product.packingQuantity!; // 1458.33333.. * 24

    console.log(`\n🔄 Edit Mode Simulation (The Bug):`);
    console.log(`   1. Loaded Total: ${dbCostValue}`);
    console.log(`   2. Loaded Qty: ${dbQty}`);
    console.log(`   3. Calculated Unit Cost (Total/Qty): ${loadedUnitCostCdf}`);
    console.log(`   4. 'PER_PACK' Price Displayed (UnitCost * 24): ${loadedDisplayPrice}`);

    console.log(`\n❌ COMPARISON:`);
    console.log(`   Original Input Price: ${inputPackPrice}`);
    console.log(`   Re-calculated Price : ${loadedDisplayPrice}`);

    const diff = Math.abs(inputPackPrice - loadedDisplayPrice);
    if (diff > 0.01) {
        console.log(`\n🔥 BUG CONFIRMED! Value mutated by ${diff} FC.`);
    } else {
        console.log(`\n✅ No mutation detected? (Check decimal precision)`);
    }

    // Cleanup
    await prisma.stockMovement.deleteMany({ where: { investmentId: investment.id } });
    await prisma.investment.delete({ where: { id: investment.id } });
}

reproduceBug()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
