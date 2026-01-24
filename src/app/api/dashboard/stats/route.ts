import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        // 1. Sales Stats (Today)
        const sales = await prisma.sale.aggregate({
            where: {
                createdAt: { gte: startOfDay, lt: endOfDay },
                status: "COMPLETED"
            },
            _count: true,
            _sum: {
                totalNet: true
            }
        });

        const salesCount = sales._count || 0;
        const salesTotal = Number(sales._sum.totalNet || 0);
        const avgTicket = salesCount > 0 ? salesTotal / salesCount : 0;

        // 2. Low Stock Alerts
        const lowStockCount = await prisma.stockItem.count({
            where: {
                quantity: { lte: 5 } // Threshold logic could be improved
            }
        });

        // 3. Recent Activity (Last 5 Sales)
        const recentSales = await prisma.sale.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } } }
        });

        const activity = recentSales.map(sale => ({
            type: "SALE",
            title: `Vente #${sale.ticketNum}`,
            time: sale.createdAt.toISOString(), // Client will format
            value: `${Number(sale.totalNet).toLocaleString()} USD`, // Adjust currency?
            user: sale.user.name
        }));

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    salesCount,
                    salesTotal,
                    avgTicket,
                    lowStockCount
                },
                activity
            }
        });

    } catch (error: any) {
        console.error("[DASHBOARD_STATS]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
