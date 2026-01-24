import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
    try {
        const types = await prisma.productTypeMetadata.findMany({
            orderBy: { sortOrder: "asc" },
        });

        return NextResponse.json({
            success: true,
            data: types,
        });
    } catch (error) {
        console.error("Error fetching product types:", error);
        return NextResponse.json(
            { success: false, error: "Erreur lors du chargement des types de produits" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if ((session?.user as any)?.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Non autorisé" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { code, label, labelEn } = body;

        if (!code || !label) {
            return NextResponse.json(
                { success: false, error: "Champs requis manquants: code et label" },
                { status: 400 }
            );
        }

        // Check if exists
        const existing = await prisma.productTypeMetadata.findUnique({
            where: { code },
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: "Ce code de type de produit existe déjà" },
                { status: 400 }
            );
        }

        const newType = await prisma.productTypeMetadata.create({
            data: {
                code,
                label,
                labelEn,
                active: true,
            },
        });

        return NextResponse.json({ success: true, data: newType });
    } catch (error) {
        console.error("Error creating product type:", error);
        return NextResponse.json(
            { success: false, error: "Erreur lors de la création du type de produit" },
            { status: 500 }
        );
    }
}
