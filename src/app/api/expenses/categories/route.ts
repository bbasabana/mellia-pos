import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        let categories = await prisma.expenseCategory.findMany({
            where: { active: true },
            orderBy: { name: "asc" },
        });

        // If no categories exist, seed some defaults
        if (categories.length === 0) {
            const defaults = [
                { name: "Transport", description: "Frais de déplacement" },
                { name: "Carburant", description: "Achat de carburant" },
                { name: "Maintenance", description: "Réparations et entretien" },
                { name: "Petite dépense", description: "Courses et menus articles" },
                { name: "Avance sur salaire", description: "Avance aux employés" },
                { name: "Autre", description: "Dépenses diverses" },
            ];

            await prisma.expenseCategory.createMany({
                data: defaults,
            });

            categories = await prisma.expenseCategory.findMany({
                where: { active: true },
                orderBy: { name: "asc" },
            });
        }

        return NextResponse.json({ success: true, data: categories });
    } catch (error: any) {
        console.error("[EXPENSE_CATEGORIES_GET]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, description } = body;

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        const category = await prisma.expenseCategory.create({
            data: {
                name,
                description,
            },
        });

        return NextResponse.json({ success: true, data: category });
    } catch (error: any) {
        console.error("[EXPENSE_CATEGORIES_POST]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
