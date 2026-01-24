
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// GET: Fetch a specific Inventory Session with its items
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const inventorySession = await prisma.inventorySession.findUnique({
            where: { id: params.id },
            include: {
                // Include items to resume counting
                items: {
                    include: {
                        product: true // To show product names
                    }
                }
            }
        });

        if (!inventorySession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: inventorySession });

    } catch (error) {
        console.error("Inventory Session GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Delete an Inventory Session (only if OPEN or strictly required)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Verify session exists and status
        const userRole = (session?.user as any)?.role;
        if (userRole !== "ADMIN") {
            return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
        }

        const inventorySession = await prisma.inventorySession.findUnique({
            where: { id: params.id }
        });

        if (!inventorySession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Ideally only allow deleting OPEN sessions to preserve history
        // But user might want to delete a closed one if it was a mistake. 
        // For data integrity, if it's CLOSED, we generated movements. 
        // Deleting the session won't revert movements automatically without complex logic.
        // For now, restrict to OPEN sessions for safety, unless we implement revert logic.

        if (inventorySession.status !== "OPEN") {
            return NextResponse.json({
                error: "Cannot delete a closed session. It has already affected stock."
            }, { status: 400 });
        }

        // Cascade delete items is handled by Prisma schema if configured (onDelete: Cascade)
        // Let's check schema:
        // model InventoryItem { session InventorySession @relation(..., onDelete: Cascade) }
        // Yes, it is.

        await prisma.inventorySession.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true, message: "Session deleted" });

    } catch (error) {
        console.error("Inventory Session DELETE Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
