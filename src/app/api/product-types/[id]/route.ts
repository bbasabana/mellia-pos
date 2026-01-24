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

        const body = await req.json();
        const { label, labelEn, active } = body;

        const updatedType = await prisma.productTypeMetadata.update({
            where: { id: params.id },
            data: {
                label,
                labelEn,
                active,
            },
        });

        return NextResponse.json({ success: true, data: updatedType });
    } catch (error) {
        console.error("Error updating product type:", error);
        return NextResponse.json(
            { success: false, error: "Erreur lors de la mise à jour du type de produit" },
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

        // Optional: Check if used in categories first to prevent orphaned data issues
        // This depends on the relation. The schema showed `productType` as a String in CategoryMetadata, so it's a loose reference.
        // It's safer to check first.

        const typeToDelete = await prisma.productTypeMetadata.findUnique({
            where: { id: params.id },
        });

        if (!typeToDelete) {
            return NextResponse.json(
                { success: false, error: "Type introuvable" },
                { status: 404 }
            );
        }

        const usedInCategories = await prisma.categoryMetadata.findFirst({
            where: { productType: typeToDelete.code },
        });

        if (usedInCategories) {
            return NextResponse.json(
                { success: false, error: "Impossible de supprimer: Ce type est utilisé par des catégories." },
                { status: 400 }
            );
        }

        await prisma.productTypeMetadata.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting product type:", error);
        return NextResponse.json(
            { success: false, error: "Erreur lors de la suppression du type de produit" },
            { status: 500 }
        );
    }
}
