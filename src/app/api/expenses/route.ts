import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Prisma } from "@prisma/client";
import { getStartDate, withEra } from "@/lib/cash-period";
import { closedDayRefusal } from "@/lib/cash-count";
import { resolveEntryDate } from "@/lib/entry-date";

const refuse = (error: string) => NextResponse.json({ success: false, error }, { status: 403 });

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "current"; // current, all, today, week, month, year, custom
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        let whereClause: any = {};

        const now = new Date();
        const lastClosure = await prisma.cashMonthClosure.findFirst({
            orderBy: { closedAt: "desc" },
            select: { closedAt: true },
        });
        const openPeriodStart = lastClosure?.closedAt ?? null;

        if (period === "all") {
            whereClause = {};
        } else if (period === "current") {
            if (openPeriodStart) {
                whereClause = { date: { gte: openPeriodStart, lte: now } };
            } else {
                whereClause = {};
            }
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

        // Before the start date everything is archived: shown only with ?archives=1.
        const archives = searchParams.get("archives") === "1";
        const eraWhere = withEra(whereClause, "date", await getStartDate(), archives);

        const expenses = await prisma.expense.findMany({
            where: eraWhere,
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

        const role = (session.user as any).role;
        // A day picked in the form becomes a moment in that day (today: now), never 00:00 UTC.
        const entryDate = resolveEntryDate(date);
        const refusal = await closedDayRefusal(entryDate, role);
        if (refusal) return refuse(refusal);

        const expense = await prisma.expense.create({
            data: {
                description,
                amount: new Prisma.Decimal(amount),
                categoryId,
                source: source || "CASH_REGISTER",
                userId: session.user.id,
                date: entryDate,
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

        const role = (session.user as any).role;
        const current = await prisma.expense.findUnique({ where: { id }, select: { date: true } });
        const entryDate = date ? resolveEntryDate(date, current?.date) : undefined;
        if (current) {
            const refusal =
                (await closedDayRefusal(current.date, role)) ??
                (entryDate ? await closedDayRefusal(entryDate, role) : null);
            if (refusal) return refuse(refusal);
        }

        const expense = await prisma.expense.update({
            where: { id },
            data: {
                description,
                amount: new Prisma.Decimal(amount),
                categoryId,
                source: source || "CASH_REGISTER",
                date: entryDate,
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
