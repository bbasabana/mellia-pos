import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";

const profileSelect = { id: true, name: true, email: true, phone: true, role: true } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The profile of the signed-in user, never anyone else's. */
async function currentUserId() {
    const session = await getServerSession(authOptions);
    return session?.user?.id ?? null;
}

function fail(error: string, status: number) {
    return NextResponse.json({ success: false, error }, { status });
}

export async function GET() {
    const userId = await currentUserId();
    if (!userId) return fail("Non autorisé", 401);

    try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: profileSelect });
        if (!user) return fail("Utilisateur introuvable", 404);
        return NextResponse.json({ success: true, data: user });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return fail("Erreur serveur", 500);
    }
}

/**
 * PUT {name?, email?, phone?, currentPassword?, password?}: the user edits their own profile.
 * A new password requires the current one. Role and status are never editable here.
 */
export async function PUT(request: Request) {
    const userId = await currentUserId();
    if (!userId) return fail("Non autorisé", 401);

    try {
        const { name, email, phone, currentPassword, password } = await request.json();

        const updateData: Prisma.UserUpdateInput = {};

        if (name !== undefined) {
            const clean = typeof name === "string" ? name.trim() : "";
            if (clean.length < 2) return fail("Le nom doit faire au moins 2 caractères", 400);
            updateData.name = clean.slice(0, 80);
        }
        if (email !== undefined) {
            const clean = typeof email === "string" ? email.toLowerCase().trim() : "";
            if (!EMAIL_RE.test(clean)) return fail("Adresse email invalide", 400);
            updateData.email = clean;
        }
        if (phone !== undefined) {
            const clean = typeof phone === "string" ? phone.trim() : "";
            if (clean && !/^\+?[0-9 ]{6,20}$/.test(clean)) return fail("Numéro de téléphone invalide", 400);
            updateData.phone = clean || null;
        }
        if (password !== undefined && password !== "") {
            if (typeof password !== "string" || password.length < 8) {
                return fail("Le nouveau mot de passe doit faire au moins 8 caractères", 400);
            }
            const current = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
            if (!current) return fail("Utilisateur introuvable", 404);
            if (typeof currentPassword !== "string" || !(await verifyPassword(currentPassword, current.passwordHash))) {
                return fail("Mot de passe actuel incorrect", 400);
            }
            updateData.passwordHash = await hashPassword(password);
        }

        const user = await prisma.user.update({ where: { id: userId }, data: updateData, select: profileSelect });
        return NextResponse.json({ success: true, data: user });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return fail("Cet email est déjà utilisé par un autre compte", 409);
        }
        console.error("Error updating profile:", error);
        return fail("Erreur serveur", 500);
    }
}
