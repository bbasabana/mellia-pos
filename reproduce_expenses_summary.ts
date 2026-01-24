
import { PrismaClient, SaleStatus, FundSource } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Starting reproduction of Expenses Summary logic...");

        const now = new Date();
        // Mimic "period=today" logic
        const gte = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lte = new Date();

        console.log(`Date Range: ${gte.toISOString()} - ${lte.toISOString()}`);

        // 1. Total Sales
        console.log("Fetching Sales...");
        const sales = await prisma.sale.aggregate({
            where: {
                createdAt: { gte, lte },
                status: "COMPLETED",
            },
            _sum: {
                totalNet: true,
            },
        });
        console.log("Sales raw result:", sales);
        // Test the conversion logic exactly as in the route
        try {
            const totalSales = Number(sales._sum.totalNet || 0);
            console.log("Total Sales (Number converted):", totalSales);
        } catch (e) {
            console.error("Error converting sales total:", e);
        }

        // 2. Total Expenses
        console.log("Fetching Expenses...");
        const expenses = await prisma.expense.aggregate({
            where: {
                date: { gte, lte },
                source: "CASH_REGISTER",
            },
            _sum: {
                amount: true,
            },
        });
        console.log("Expenses raw result:", expenses);
        try {
            const totalExpenses = Number(expenses._sum.amount || 0);
            console.log("Total Expenses (Number converted):", totalExpenses);
        } catch (e) {
            console.error("Error converting expenses total:", e);
        }

        // 3. Investment
        console.log("Fetching Investments...");
        const purchases = await prisma.investment.aggregate({
            where: {
                date: { gte, lte },
                source: "CASH_REGISTER",
            },
            _sum: {
                totalAmount: true,
            },
        });
        console.log("Purchases raw result:", purchases);
        try {
            const totalPurchases = Number(purchases._sum.totalAmount || 0);
            console.log("Total Purchases (Number converted):", totalPurchases);
        } catch (e) {
            console.error("Error converting purchases total:", e);
        }

        // 4. Boss Expenses
        console.log("Fetching Boss Expenses...");
        const expensesBoss = await prisma.expense.aggregate({
            where: {
                date: { gte, lte },
                source: "OWNER_CAPITAL",
            },
            _sum: {
                amount: true,
            },
        });
        console.log("Boss Expenses raw result:", expensesBoss);
        try {
            const totalExpensesBoss = Number(expensesBoss._sum.amount || 0);
            console.log("Total Boss Expenses (Number converted):", totalExpensesBoss);
        } catch (e) {
            console.error("Error converting boss expenses total:", e);
        }

        console.log("Reproduction script finished successfully.");

    } catch (e: any) {
        console.error("Reproduction CRITICAL Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
