import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
    try {
        const [types, categories] = await Promise.all([
            prisma.productTypeMetadata.findMany({
                orderBy: { sortOrder: "asc" },
            }),
            prisma.categoryMetadata.findMany({
                where: { active: true },
                orderBy: { sortOrder: "asc" },
            }),
        ]);

        // Group categories by productType
        const groupedCategories: Record<string, any[]> = {};

        categories.forEach((cat) => {
            if (!groupedCategories[cat.productType]) {
                groupedCategories[cat.productType] = [];
            }
            groupedCategories[cat.productType].push(cat);
        });

        return NextResponse.json({
            success: true,
            data: {
                types,
                categories: groupedCategories,
            },
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { success: false, error: "Erreur lors du chargement des catégories" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        // Check auth and role
        const session = await getServerSession(authOptions);
        if ((session?.user as any)?.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Non autorisé" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { code, label, productType, labelEn } = body;

        if (!code || !label || !productType) {
            return NextResponse.json(
                { success: false, error: "Champs requis manquants" },
                { status: 400 }
            );
        }

        // Check availability
        const existing = await prisma.categoryMetadata.findUnique({
            where: { code },
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: "Ce code catégorie existe déjà" },
                { status: 400 }
            );
        }

        const category = await prisma.categoryMetadata.create({
            data: {
                code,
                label,
                productType,
                labelEn,
                active: true,
            },
        });

        return NextResponse.json({ success: true, data: category });
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json(
            { success: false, error: "Erreur lors de la création de la catégorie" },
            { status: 500 }
        );
    }
}
