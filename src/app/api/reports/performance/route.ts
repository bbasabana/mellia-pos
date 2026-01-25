import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "all"; // all, week, month, year, today
        const start = searchParams.get("startDate");
        const end = searchParams.get("endDate");

        let startDate: Date;
        let endDate: Date = end ? endOfDay(new Date(end)) : endOfDay(new Date());

        if (start) {
            startDate = startOfDay(new Date(start));
        } else {
            switch (period) {
                case "today":
                    startDate = startOfDay(new Date());
                    break;
                case "week":
                    startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
                    break;
                case "month":
                    startDate = startOfMonth(new Date());
                    break;
                case "year":
                    startDate = startOfYear(new Date());
                    break;
                default:
                    startDate = new Date(0); // Beginning of time
            }
        }

        const dateFilter = {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        };

        // 1. Fetch COMPLETED Sales
        const sales = await prisma.sale.findMany({
            where: {
                status: "COMPLETED",
                ...dateFilter
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        // 2. Fetch Investments (Purchases)
        const investments = await prisma.investment.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                }
            }
        });

        // 3. Fetch Expenses
        const expenses = await prisma.expense.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                }
            }
        });

        // 4. Aggregate Sales Data
        let totalRevenue = 0;
        let totalCogs = 0; // Cost of Goods Sold
        let itemsSold: Record<string, { name: string, qty: number, revenue: number, cost: number }> = {};

        sales.forEach(sale => {
            totalRevenue += Number(sale.totalNet);
            sale.items.forEach(item => {
                const qty = Number(item.quantity);
                const itemRevenue = Number(item.totalPrice);
                const itemCost = Number(item.unitCost) * qty;

                totalCogs += itemCost;

                if (!itemsSold[item.productId]) {
                    itemsSold[item.productId] = {
                        name: item.product.name,
                        qty: 0,
                        revenue: 0,
                        cost: 0
                    };
                }
                itemsSold[item.productId].qty += qty;
                itemsSold[item.productId].revenue += itemRevenue;
                itemsSold[item.productId].cost += itemCost;
            });
        });

        // 5. Aggregate Investment Data
        let totalInvestment = investments.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);

        // 6. Aggregate Expenses
        let totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

        // 7. Calculate Profits
        const grossProfit = totalRevenue - totalCogs;
        const netProfit = grossProfit - totalExpenses;
        const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        // 8. Prepare Detailed Table Data
        const details = Object.values(itemsSold).map(item => ({
            ...item,
            profit: item.revenue - item.cost,
            margin: item.revenue > 0 ? ((item.revenue - item.cost) / item.revenue) * 100 : 0
        })).sort((a, b) => b.profit - a.profit);

        return NextResponse.json({
            success: true,
            data: {
                period,
                startDate,
                endDate,
                summary: {
                    totalSales: totalRevenue,
                    totalInvestment: totalInvestment, // Raw money put into stock
                    totalCogs: totalCogs,           // Cost of items actually sold
                    totalExpenses: totalExpenses,
                    grossProfit,
                    netProfit,
                    marginPercent,
                },
                details
            }
        });

    } catch (error: any) {
        console.error("Performance Reports API Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
