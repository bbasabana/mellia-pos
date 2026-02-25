import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;

        // Strict authorization
        if (userRole !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Permission refusée. Accès administrateur requis." },
                { status: 403 }
            );
        }

        const { confirmation } = await request.json();

        if (confirmation !== "EFFACER") {
            return NextResponse.json(
                { success: false, error: "Code de confirmation incorrect." },
                { status: 400 }
            );
        }

        console.log("🧨 [RESET] Starting full data reset...");

        // Perform reset in a transaction with an extended timeout (30 seconds)
        // because deleting large amounts of data on a serverless DB can be slow.
        await prisma.$transaction(async (tx) => {
            // 1. Clear Sales related data
            await tx.saleItem.deleteMany({});
            await tx.kitchenOrder.deleteMany({});
            await tx.deliveryInfo.deleteMany({});
            await tx.financialTransaction.deleteMany({});
            await tx.loyaltyTransaction.deleteMany({});
            await tx.sale.deleteMany({});

            // 2. Clear Inventory and Stock data
            await tx.stockMovement.deleteMany({});
            await tx.inventoryItem.deleteMany({});
            await tx.inventorySession.deleteMany({});

            // Reset StockItem quantities to 0
            await tx.stockItem.updateMany({
                data: { quantity: 0 }
            });

            // 3. Clear Financial data
            await tx.salaryAdvance.deleteMany({});
            await tx.expense.deleteMany({});
            await tx.investment.deleteMany({});

            // 4. Reset Clients points
            await tx.client.updateMany({
                data: { points: 0 }
            });

            // 5. Clear Audit Logs (leaving this one for last or keeping it?)
            // We'll clear it but we'll create a NEW one right after the transaction.
            await tx.auditLog.deleteMany({});
        }, {
            maxWait: 5000, // default
            timeout: 30000, // 30 seconds
        });

        // Create a fresh audit log for this massive action
        await createAuditLog({
            userId: (session.user as any).id,
            action: "SYSTEM_RESET",
            entity: "System",
            entityId: "ALL",
            metadata: {
                timestamp: new Date().toISOString(),
                confirmedBy: (session.user as any).email
            },
        });

        console.log("✅ [RESET] Full data reset completed successfully.");

        return NextResponse.json({
            success: true,
            message: "Toutes les données ont été réinitialisées avec succès."
        });

    } catch (error: any) {
        console.error("🚨 [RESET] Failed to reset data:", error);
        return NextResponse.json(
            { success: false, error: `Erreur lors de la réinitialisation: ${error.message}` },
            { status: 500 }
        );
    }
}
