
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        console.log("🔍 [DEBUG-DB] Starting connectivity test...");

        // 1. Check Env Var (Masked)
        const dbUrl = process.env.DATABASE_URL || "MISSING";
        const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");

        // 2. Try to connect and count users
        const userCount = await prisma.user.count();

        // 3. Try to find the admin user
        const adminUser = await prisma.user.findUnique({
            where: { email: "admin@mellia.pos" },
            select: { id: true, email: true, role: true, status: true }
        });

        return NextResponse.json({
            success: true,
            message: "Database is reachable from Vercel",
            env: {
                DATABASE_URL_DETECTED: dbUrl !== "MISSING",
                DATABASE_URL_PREVIEW: maskedUrl,
                NODE_ENV: process.env.NODE_ENV
            },
            stats: {
                totalUsersInDb: userCount
            },
            adminUserFound: !!adminUser,
            adminUserDetails: adminUser || "N/A"
        });

    } catch (error: any) {
        console.error("🚨 [DEBUG-DB] Test failed:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Unknown error during DB test",
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        }, { status: 500 });
    }
}
