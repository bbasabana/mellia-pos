import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if ((session?.user as any)?.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Non autorisé" },
                { status: 403 }
            );
        }

        const { id } = params;
        const body = await req.json();
        const { label, labelEn, active } = body;

        const category = await prisma.categoryMetadata.update({
            where: { id },
            data: {
                label,
                labelEn,
                active,
            },
        });

        return NextResponse.json({ success: true, data: category });
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json(
            { success: false, error: "Erreur lors de la mise à jour" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if ((session?.user as any)?.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Non autorisé" },
                { status: 403 }
            );
        }

        const { id } = params;

        // Check usage before delete could be added here if needed
        // But since we use prisma enums in product table, metadata delete is safe for product integrity
        // (It just means the label customization is gone)

        await prisma.categoryMetadata.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json(
            { success: false, error: "Erreur lors de la suppression" },
            { status: 500 }
        );
    }
}
