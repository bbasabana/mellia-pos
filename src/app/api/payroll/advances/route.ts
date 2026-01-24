
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { userId, amount, reason } = body;

        // Create Advance
        const advance = await prisma.salaryAdvance.create({
            data: {
                userId,
                amount: parseFloat(amount),
                reason,
                status: "APPROVED", // Auto-approve for now for simplicity, or "PENDING"
                date: new Date()
            }
        });

        // Optional: Create Expense automatically?
        // For now, allow separate expense creation or manual link. 
        // Logic: Often taking money from till for advance IS an expense.

        return NextResponse.json({ success: true, data: advance });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "UserId required" }, { status: 400 });

    const advances = await prisma.salaryAdvance.findMany({
        where: { userId },
        orderBy: { date: 'desc' }
    });

    return NextResponse.json({ success: true, data: advances });
}
