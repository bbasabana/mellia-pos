import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "active"; // active, today, past, all

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        let whereClause: any = {};

        if (type === "active") {
            whereClause.status = {
                in: ["PENDING", "IN_PREPARATION", "READY"]
            };
        } else if (type === "today") {
            whereClause.createdAt = {
                gte: startOfToday,
                lte: endOfToday
            };
        } else if (type === "past") {
            whereClause.createdAt = {
                lt: startOfToday
            };
            whereClause.status = "DELIVERED";
        } else if (type === "all") {
            // No additional filter
        }

        const orders = await prisma.kitchenOrder.findMany({
            where: whereClause,
            include: {
                sale: {
                    include: {
                        items: {
                            include: {
                                product: true
                            }
                        },
                        client: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: [
                { priority: 'desc' }, // High priority first
                { createdAt: 'asc' }  // Oldest first
            ]
        });

        return NextResponse.json({ success: true, data: orders });
    } catch (error: any) {
        console.error("Kitchen API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
