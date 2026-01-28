import { Prisma } from "@prisma/client";
import { StockLocation } from "@prisma/client";

/**
 * Helper to deduct stock across multiple locations based on priority.
 * This should be called within a Prisma transaction.
 */
export async function deductStock(
    tx: any, // Prisma.TransactionClient
    productId: string,
    quantity: number,
    productType: string,
    saleTicketNum: string,
    userId: string
) {
    // Define priorities based on type
    let priorities: StockLocation[] = [];
    if (productType === "BEVERAGE") {
        priorities = ["FRIGO", "CASIER", "DEPOT"];
    } else if (productType === "FOOD") {
        priorities = ["CUISINE", "ECONOMAT", "DEPOT"];
    } else {
        priorities = ["DEPOT", "ECONOMAT", "FRIGO", "CASIER", "CUISINE"];
    }

    // 1. Fetch all stock items for this product
    const stockItems = await tx.stockItem.findMany({
        where: { productId }
    });

    // 2. Map and Sum
    const stockMap = new Map<StockLocation, number>();
    stockItems.forEach((item: any) => {
        stockMap.set(item.location, Number(item.quantity));
    });

    const totalAvailable = Array.from(stockMap.values()).reduce((a, b) => a + b, 0);

    if (totalAvailable < quantity) {
        throw new Error(`Stock insuffisant. Total disponible: ${totalAvailable}`);
    }

    // 3. Deduct according to priority
    let remainingToDeduct = quantity;

    for (const location of priorities) {
        if (remainingToDeduct <= 0) break;

        const currentQty = stockMap.get(location) || 0;
        if (currentQty <= 0) continue;

        const amountToTake = Math.min(currentQty, remainingToDeduct);

        // Update StockItem
        await tx.stockItem.update({
            where: {
                productId_location: {
                    productId,
                    location
                }
            },
            data: {
                quantity: { decrement: amountToTake }
            }
        });

        // Create Movement
        await tx.stockMovement.create({
            data: {
                productId,
                type: "OUT",
                quantity: new Prisma.Decimal(amountToTake),
                fromLocation: location,
                reason: `Vente #${saleTicketNum}`,
                userId
            }
        });

        remainingToDeduct -= amountToTake;
    }

    // If there's still something to deduct but no stock in prioritized locations?
    // This shouldn't happen because of the totalAvailable check, 
    // but if it does (e.g. remaining locations not in priorities), 
    // we should check other locations as a last resort.
    if (remainingToDeduct > 0) {
        for (const [location, qty] of stockMap.entries()) {
            if (remainingToDeduct <= 0) break;
            if (priorities.includes(location)) continue; // Already checked
            if (qty <= 0) continue;

            const amountToTake = Math.min(qty, remainingToDeduct);
            await tx.stockItem.update({
                where: { productId_location: { productId, location } },
                data: { quantity: { decrement: amountToTake } }
            });
            await tx.stockMovement.create({
                data: {
                    productId,
                    type: "OUT",
                    quantity: new Prisma.Decimal(amountToTake),
                    fromLocation: location,
                    reason: `Vente #${saleTicketNum}`,
                    userId
                }
            });
            remainingToDeduct -= amountToTake;
        }
    }

    if (remainingToDeduct > 0) {
        throw new Error(`Erreur critique de stock pour le produit ${productId}`);
    }
}

/**
 * Helper to restore stock (e.g. on cancellation or quantity reduction).
 * Restores to the primary location by default.
 */
export async function restoreStock(
    tx: any,
    productId: string,
    quantity: number,
    productType: string,
    saleTicketNum: string,
    userId: string
) {
    const primaryLocation: StockLocation = productType === "BEVERAGE" ? "FRIGO" :
        (productType === "FOOD" ? "CUISINE" : "DEPOT");

    await tx.stockItem.upsert({
        where: {
            productId_location: {
                productId,
                location: primaryLocation
            }
        },
        create: {
            productId,
            location: primaryLocation,
            quantity: new Prisma.Decimal(quantity)
        },
        update: {
            quantity: { increment: quantity }
        }
    });

    await tx.stockMovement.create({
        data: {
            productId,
            type: "IN",
            quantity: new Prisma.Decimal(quantity),
            toLocation: primaryLocation,
            reason: `Restitution Vente #${saleTicketNum}`,
            userId
        }
    });
}
