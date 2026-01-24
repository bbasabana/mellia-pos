import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const query = searchParams.get("query") || "";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const skip = (page - 1) * limit;

        const where: Prisma.SaleWhereInput = {
            status: "COMPLETED",
        };

        if (query) {
            where.OR = [
                { ticketNum: { contains: query, mode: "insensitive" } },
                { client: { name: { contains: query, mode: "insensitive" } } },
            ];
        }

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

        const [sales, total] = await Promise.all([
            prisma.sale.findMany({
                where,
                include: {
                    client: true,
                    user: true, // Cashier
                    items: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.sale.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: sales,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
