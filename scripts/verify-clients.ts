
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("--- Verifying Client CRUD ---");

    // 1. Create
    const phone = `099-${Date.now()}`;
    console.log(`Creating client with phone ${phone}...`);
    const newClient = await prisma.client.create({
        data: {
            name: "Test Client",
            phone: phone,
            email: `test-${Date.now()}@example.com`,
            points: 0
        }
    });
    console.log("Created:", newClient.id);

    // 2. Read
    const fetched = await prisma.client.findUnique({
        where: { id: newClient.id }
    });
    if (!fetched) throw new Error("Client not found!");
    console.log("Fetched:", fetched.name);

    // 3. Update (Add points)
    const updated = await prisma.client.update({
        where: { id: newClient.id },
        data: { points: 50 },
    });
    console.log("Updated Points:", updated.points);

    // 4. Cleanup
    await prisma.client.delete({ where: { id: newClient.id } });
    console.log("Deleted.");

    console.log("--- Client Verification Passed ---");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
