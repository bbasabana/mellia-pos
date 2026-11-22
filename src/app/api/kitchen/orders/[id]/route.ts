import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const role = (session?.user as any)?.role;
        if (role !== "ADMIN" && role !== "MANAGER") {
            return NextResponse.json({ success: false, error: "Réservé aux administrateurs et gérants" }, { status: 403 });
        }

        const { id } = params;

        await prisma.kitchenOrder.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Commande supprimée" });
    } catch (error: any) {
        console.error("Kitchen Delete Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
