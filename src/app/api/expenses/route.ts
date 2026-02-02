import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "all"; // all, today, week, month, year, custom
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        let whereClause: any = {};

        const now = new Date();
        if (period === "all") {
            // No date filter - fetch all expenses
            whereClause = {};
        } else if (period === "today") {
            const gte = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const lte = new Date();
            whereClause = { date: { gte, lte } };
        } else if (period === "week") {
            const gte = new Date(now);
            gte.setDate(now.getDate() - 7);
            const lte = new Date();
            whereClause = { date: { gte, lte } };
        } else if (period === "month") {
            const gte = new Date(now.getFullYear(), now.getMonth(), 1);
            const lte = new Date();
            whereClause = { date: { gte, lte } };
        } else if (period === "year") {
            const gte = new Date(now.getFullYear(), 0, 1);
            const lte = new Date();
            whereClause = { date: { gte, lte } };
        } else if (period === "custom" && start && end) {
            const gte = new Date(start);
            const lte = new Date(end);
            lte.setHours(23, 59, 59, 999);
            whereClause = { date: { gte, lte } };
        }

        const expenses = await prisma.expense.findMany({
            where: whereClause,
            include: {
                category: true,
                user: {
                    select: { name: true },
                },
            },
            orderBy: { date: "desc" },
        });

        return NextResponse.json({ success: true, data: expenses });
    } catch (error: any) {
        console.error("[EXPENSES_GET]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { description, amount, categoryId, source, date } = body;

        if (!description || !amount || !categoryId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const expense = await prisma.expense.create({
            data: {
                description,
                amount: new Prisma.Decimal(amount),
                categoryId,
                source: source || "CASH_REGISTER",
                userId: session.user.id,
                date: date ? new Date(date) : new Date(),
            },
            include: {
                category: true,
            },
        });

        return NextResponse.json({ success: true, data: expense });
    } catch (error: any) {
        console.error("[EXPENSES_POST]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { id, description, amount, categoryId, source, date } = body;

        if (!id || !description || !amount || !categoryId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const expense = await prisma.expense.update({
            where: { id },
            data: {
                description,
                amount: new Prisma.Decimal(amount),
                categoryId,
                source: source || "CASH_REGISTER",
                date: date ? new Date(date) : undefined,
            },
            include: {
                category: true,
            },
        });

        return NextResponse.json({ success: true, data: expense });
    } catch (error: any) {
        console.error("[EXPENSES_PUT]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if ((session.user as any).role !== "ADMIN") {
            return new NextResponse("Only admins can delete expenses", { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return new NextResponse("Missing ID", { status: 400 });
        }

        await prisma.expense.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[EXPENSES_DELETE]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
