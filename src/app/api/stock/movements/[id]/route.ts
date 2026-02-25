
import { NextResponse } from "next/server";
import { prisma, prismaUnpooled } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// DELETE: Revert a movement
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;

        // Only Admin/Manager can delete/revert movements
        if (userRole !== "ADMIN" && userRole !== "MANAGER") {
            return NextResponse.json({ error: "Permission refused" }, { status: 403 });
        }

        const movementId = params.id;

        // Transaction: Revert stock -> Delete movement
        await prismaUnpooled.$transaction(async (tx) => {
            // 1. Get the movement
            const movement = await tx.stockMovement.findUnique({
                where: { id: movementId }
            });

            if (!movement) throw new Error("Mouvement introuvable");

            // 2. Reverse Logic
            // If movement was OUT (Sales, Loss), we need to ADD back to "fromLocation" (if exists)
            // If movement was IN (Purchase), we need to REMOVE from "toLocation"
            // If movement was TRANSFER, we need to REVERSE (Add to From, Remove from To)

            const { productId, quantity, fromLocation, toLocation } = movement;

            // Reverse "From" (It was deducted, so add it back)
            if (fromLocation) {
                await tx.stockItem.upsert({
                    where: { productId_location: { productId, location: fromLocation } },
                    update: { quantity: { increment: quantity } },
                    create: { productId, location: fromLocation, quantity }
                });
            }

            // Reverse "To" (It was added, so remove it)
            if (toLocation) {
                // Check if enough stock to remove
                const currentStock = await tx.stockItem.findUnique({
                    where: { productId_location: { productId, location: toLocation } }
                });

                if (!currentStock || currentStock.quantity.lt(quantity)) {
                    throw new Error(`Impossible d'annuler : Stock insuffisant dans ${toLocation} pour retirer ${quantity}`);
                }

                await tx.stockItem.update({
                    where: { productId_location: { productId, location: toLocation } },
                    data: { quantity: { decrement: quantity } }
                });
            }

            // 3. Delete the log
            await tx.stockMovement.delete({
                where: { id: movementId }
            });
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Delete Movement Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
