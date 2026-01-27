import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const email = body.email?.toLowerCase().trim();
        const { password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
            return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
        }

        if (user.status !== "ACTIVE") {
            return NextResponse.json({ error: "Compte inactif" }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error: any) {
        console.error("Mobile Login Error:", error);
        return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
    }
}
