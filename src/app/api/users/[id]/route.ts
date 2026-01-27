
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { hash } from "bcryptjs";

// PUT: Update User Details
export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;

        if (userRole !== "ADMIN") {
            return NextResponse.json({ error: "Permission refused" }, { status: 403 });
        }

        const body = await req.json();
        const { name, role, baseSalary, phone, status } = body;

        const updatedUser = await prisma.user.update({
            where: { id: params.id },
            data: {
                name,
                role,
                status,
                baseSalary: baseSalary ? parseFloat(baseSalary) : null,
                phone
            }
        });

        return NextResponse.json({ success: true, data: updatedUser });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// PATCH: Special Actions (Reset Password)
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;

        if (userRole !== "ADMIN") {
            return NextResponse.json({ error: "Permission refused" }, { status: 403 });
        }

        const body = await req.json();
        const { action } = body;

        if (action === "RESET_PASSWORD") {
            // Reset to random 8-char password
            const generatedPassword = Math.random().toString(36).slice(-8);
            const passwordHash = await hash(generatedPassword, 10);

            await prisma.user.update({
                where: { id: params.id },
                data: { passwordHash }
            });
            return NextResponse.json({ success: true, message: "Mot de passe réinitialisé", generatedPassword });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
