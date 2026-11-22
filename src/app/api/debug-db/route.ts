import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

/** Database connectivity check, for a signed-in administrator only. */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    try {
        const [totalUsers, admins] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: "ADMIN", status: "ACTIVE" } }),
        ]);
        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            environment: {
                DATABASE_URL_DETECTED: !!process.env.DATABASE_URL,
                NEXTAUTH_SECRET_DETECTED: !!process.env.NEXTAUTH_SECRET,
                NODE_ENV: process.env.NODE_ENV,
            },
            database: { status: "Connected", totalUsers, activeAdmins: admins },
        });
    } catch (error: any) {
        console.error("🚨 [DEBUG-DB] Test failed:", error);
        return NextResponse.json({ success: false, error: "Connexion à la base impossible" }, { status: 500 });
    }
}
