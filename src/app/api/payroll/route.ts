
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        if (userRole !== "ADMIN") return NextResponse.json({ error: "Refused" }, { status: 403 });

        const body = await req.json();
        const { userId, month, year, bonus, penalty, notes } = body;

        // 1. Get User Base Salary
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.baseSalary) throw new Error("User has no base salary defined.");

        // 2. Calculate Advances taken in that month (that are not yet deducted)
        // Actually, we usually deduct ALL pending/paid advances when paying salary, regardless of date, or just strictly month.
        // Let's stick to: Find all PAID/APPROVED advances that are NOT linked to a payroll yet.

        const openAdvances = await prisma.salaryAdvance.findMany({
            where: {
                userId,
                payrollId: null, // Not yet deducted
                status: { in: ["APPROVED", "PAID"] }
            }
        });

        const advancesTotal = openAdvances.reduce((sum, adv) => sum + adv.amount.toNumber(), 0);

        const base = user.baseSalary.toNumber();
        const bonusVal = parseFloat(bonus || 0);
        const penaltyVal = parseFloat(penalty || 0);

        const netPaid = base + bonusVal - penaltyVal - advancesTotal;

        if (netPaid < 0) {
            throw new Error(`Net to pay is negative (${netPaid}). Advances exceed salary.`);
        }

        // 3. Create Payroll Record
        const payroll = await prisma.$transaction(async (tx) => {
            const pr = await tx.payroll.create({
                data: {
                    userId,
                    month: parseInt(month),
                    year: parseInt(year),
                    baseAmount: base,
                    advancesTotal,
                    bonus: bonusVal,
                    penalty: penaltyVal,
                    netPaid,
                    notes,
                    status: "COMPLETED"
                }
            });

            // 4. Link advances to this payroll and mark DEDUCTED
            if (openAdvances.length > 0) {
                await tx.salaryAdvance.updateMany({
                    where: { id: { in: openAdvances.map(a => a.id) } },
                    data: {
                        payrollId: pr.id,
                        status: "DEDUCTED"
                    }
                });
            }

            return pr;
        });

        return NextResponse.json({ success: true, data: payroll });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
