import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: Request) {
    try {
        console.log("🔍 [API] GET /api/expenses/summary - Starting");
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            console.log("❌ [API] Unauthorized access attempt");
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "today";
        console.log(`📅 [API] Period: ${period}`);

        const now = new Date();
        let gte: Date;
        let lte: Date = new Date();

        if (period === "today") {
            gte = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (period === "month") {
            gte = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === "year") {
            gte = new Date(now.getFullYear(), 0, 1);
        } else {
            gte = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        console.log(`🕒 [API] Date Range: ${gte.toISOString()} - ${lte.toISOString()}`);

        // 1. Total Sales (Revenue)
        const sales = await prisma.sale.aggregate({
            where: {
                createdAt: { gte, lte },
                status: "COMPLETED",
            },
            _sum: {
                totalNet: true,
            },
        });
        const totalSales = Number(sales._sum.totalNet || 0);
        console.log(`💰 [API] Sales: ${totalSales}`);

        // 2. Total Expenses from Cash Register
        const expenses = await prisma.expense.aggregate({
            where: {
                date: { gte, lte },
                source: "CASH_REGISTER",
            },
            _sum: {
                amount: true,
            },
        });
        const totalExpenses = Number(expenses._sum.amount || 0);
        console.log(`💸 [API] Expenses: ${totalExpenses}`);

        // 3. Total Purchases (Investments) from Cash Register
        const purchases = await prisma.investment.aggregate({
            where: {
                date: { gte, lte },
                source: "CASH_REGISTER",
            },
            _sum: {
                totalAmount: true,
            },
        });
        const totalPurchases = Number(purchases._sum.totalAmount || 0);

        // 4. Final Cash Balance
        const balance = totalSales - totalExpenses - totalPurchases;

        // 5. Total Expenses from Boss
        const expensesBoss = await prisma.expense.aggregate({
            where: {
                date: { gte, lte },
                source: "OWNER_CAPITAL",
            },
            _sum: {
                amount: true,
            },
        });
        const totalExpensesBoss = Number(expensesBoss._sum.amount || 0);

        console.log("✅ [API] Expenses Summary Calculated Successfully");

        return NextResponse.json({
            success: true,
            data: {
                totalSales,
                totalExpenses,
                totalPurchases,
                balance,
                totalExpensesBoss,
                period,
            },
        });
    } catch (error: any) {
        console.error("❌ [API] Expenses Summary Error CRITICAL:", error);
        return NextResponse.json({
            success: false,
            error: "Internal Server Error",
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
