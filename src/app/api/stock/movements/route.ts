
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");

        const movements = await prisma.stockMovement.findMany({
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                product: {
                    select: { name: true, saleUnit: true }
                },
                user: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json({ success: true, data: movements });
    } catch (error: any) {
        console.error("Stock Movements GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
