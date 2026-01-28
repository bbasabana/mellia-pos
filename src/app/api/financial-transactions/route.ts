import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const method = searchParams.get("method");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const userId = searchParams.get("userId");

        const skip = (page - 1) * limit;

        const where: any = {};

        if (method) where.paymentMethod = method;
        if (userId) where.userId = userId;

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
            };
        } else if (startDate) {
            where.createdAt = {
                gte: new Date(startDate),
            };
        }

        const [transactions, total] = await Promise.all([
            prisma.financialTransaction.findMany({
                where,
                include: {
                    user: { select: { name: true } },
                    sale: { select: { ticketNum: true, clientId: true, client: { select: { name: true } } } }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.financialTransaction.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: transactions,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching financial transactions:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const ids = searchParams.get("ids")?.split(",");

        if (!id && (!ids || ids.length === 0)) {
            return new NextResponse("Missing IDs", { status: 400 });
        }

        const deleteIds = id ? [id] : ids!;

        await prisma.financialTransaction.deleteMany({
            where: {
                id: { in: deleteIds }
            }
        });

        // Optional: Create audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "DELETE_FINANCIAL_TRANSACTIONS",
                entity: "FinancialTransaction",
                metadata: { deletedCount: deleteIds.length, ids: deleteIds }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting financial transactions:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
