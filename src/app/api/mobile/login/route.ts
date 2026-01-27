import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { encode } from "next-auth/jwt";

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

        // CREATE NEXTAUTH COMPATIBLE TOKEN
        // This makes the mobile app "logged in" for the whole system
        const token = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };

        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
            console.error("NEXTAUTH_SECRET is not defined");
            return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
        }

        const encodedToken = await encode({
            token,
            secret,
            maxAge: 30 * 24 * 60 * 60, // 30 days
        });

        // SET COOKIE
        const response = NextResponse.json({
            success: true,
            user: token
        });

        // Determine cookie name (NextAuth default behavior)
        const isProd = process.env.NODE_ENV === 'production';
        // In Vercel, it's usually __Secure- if https is used.
        // But for local development it's plain.
        const cookieName = isProd ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

        response.cookies.set(cookieName, encodedToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            path: '/',
            maxAge: 30 * 24 * 60 * 60,
        });

        return response;

    } catch (error: any) {
        console.error("Mobile Login Error:", error);
        return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
    }
}
