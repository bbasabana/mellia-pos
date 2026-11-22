import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

const profileSelect = { id: true, name: true, email: true, role: true } as const;

/** The profile of the signed-in user, never anyone else's. */
async function currentUserId() {
    const session = await getServerSession(authOptions);
    return session?.user?.id ?? null;
}

export async function GET() {
    const userId = await currentUserId();
    if (!userId) {
        return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: profileSelect });
        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: user });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const userId = await currentUserId();
    if (!userId) {
        return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }

    try {
        const { name, email, password } = await request.json();

        const updateData: { name?: string; email?: string; passwordHash?: string } = {};
        if (typeof name === "string" && name.trim()) updateData.name = name.trim();
        if (typeof email === "string" && email.trim()) updateData.email = email.toLowerCase().trim();
        if (typeof password === "string" && password) {
            if (password.length < 8) {
                return NextResponse.json(
                    { success: false, error: "Le mot de passe doit faire au moins 8 caractères" },
                    { status: 400 }
                );
            }
            updateData.passwordHash = await hashPassword(password);
        }

        const user = await prisma.user.update({ where: { id: userId }, data: updateData, select: profileSelect });
        return NextResponse.json({ success: true, data: user });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
