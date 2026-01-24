
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        console.log("🔍 [DEBUG-DB] Starting connectivity test...");

        // 1. Check Env Var (Masked/Hashed)
        const dbUrl = process.env.DATABASE_URL || "MISSING";
        const authSecret = process.env.NEXTAUTH_SECRET || "MISSING";
        const authUrl = process.env.NEXTAUTH_URL || "MISSING";

        const maskedDbUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");

        // 2. Try to connect and count users
        let userCount = -1;
        let dbStatus = "Checking...";
        try {
            userCount = await prisma.user.count();
            dbStatus = "Connected";
        } catch (e: any) {
            dbStatus = `Connection Failed: ${e.message}`;
        }

        // 3. Try to find the admin user
        let adminUser = null;
        if (dbStatus === "Connected") {
            adminUser = await prisma.user.findUnique({
                where: { email: "admin@mellia.pos" },
                select: { id: true, email: true, role: true, status: true }
            });
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            environment: {
                DATABASE_URL_DETECTED: dbUrl !== "MISSING",
                DATABASE_URL_MASKED: maskedDbUrl,
                NEXTAUTH_SECRET_DETECTED: authSecret !== "MISSING",
                NEXTAUTH_URL: authUrl,
                NODE_ENV: process.env.NODE_ENV
            },
            database: {
                status: dbStatus,
                totalUsers: userCount
            },
            adminUser: {
                found: !!adminUser,
                details: adminUser || "N/A"
            }
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
