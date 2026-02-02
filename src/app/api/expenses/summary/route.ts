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
        const period = searchParams.get("period") || "all";
        console.log(`📅 [API] Period: ${period}`);

        const now = new Date();
        let gte: Date | undefined;
        let lte: Date | undefined;

        if (period === "all") {
            // No date filter - calculate from all time
            gte = undefined;
            lte = undefined;
        } else if (period === "today") {
            gte = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            lte = new Date();
        } else if (period === "week") {
            gte = new Date(now);
            gte.setDate(now.getDate() - 7);
            lte = new Date();
        } else if (period === "month") {
            gte = new Date(now.getFullYear(), now.getMonth(), 1);
            lte = new Date();
        } else if (period === "year") {
            gte = new Date(now.getFullYear(), 0, 1);
            lte = new Date();
        }
        
        if (gte && lte) {
            console.log(`🕒 [API] Date Range: ${gte.toISOString()} - ${lte.toISOString()}`);
        } else {
            console.log(`🕒 [API] Date Range: ALL TIME`);
        }

        // Build where clause for date filtering
        const dateFilter = (gte && lte) ? { gte, lte } : undefined;

        // 1. Total Sales (Revenue) in CDF
        const sales = await prisma.sale.aggregate({
            where: {
                ...(dateFilter && { createdAt: dateFilter }),
                status: "COMPLETED",
            },
            _sum: {
                totalCdf: true,
            },
        });
        const totalSales = Number(sales._sum.totalCdf || 0);
        console.log(`💰 [API] Sales (CDF): ${totalSales}`);

        // 2. Total Expenses from Cash Register (Already in CDF)
        const expenses = await prisma.expense.aggregate({
            where: {
                ...(dateFilter && { date: dateFilter }),
                source: "CASH_REGISTER",
            },
            _sum: {
                amount: true,
            },
        });
        const totalExpenses = Number(expenses._sum.amount || 0);
        console.log(`💸 [API] Expenses (CDF): ${totalExpenses}`);

        // 3. Total Purchases (Investments) from Cash Register in CDF
        const purchases = await prisma.investment.aggregate({
            where: {
                ...(dateFilter && { date: dateFilter }),
                source: "CASH_REGISTER",
            },
            _sum: {
                totalAmountCdf: true,
            },
        });
        const totalPurchases = Number(purchases._sum.totalAmountCdf || 0);
        console.log(`🛒 [API] Purchases (CDF): ${totalPurchases}`);

        // 4. Final Cash Balance in CDF
        const balance = totalSales - totalExpenses - totalPurchases;

        // 5. Total Expenses from Boss
        const expensesBoss = await prisma.expense.aggregate({
            where: {
                ...(dateFilter && { date: dateFilter }),
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
