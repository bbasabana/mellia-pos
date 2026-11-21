import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "active"; // active, today, past, all
        // Orders of drinks only have nothing to cook: hidden unless asked for.
        const withDrinks = searchParams.get("withDrinks") === "1";

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        let whereClause: any = {};

        if (type === "active") {
            whereClause.status = {
                in: ["PENDING", "IN_PREPARATION", "READY"]
            };
        } else if (type === "today") {
            whereClause.createdAt = {
                gte: startOfToday,
                lte: endOfToday
            };
        } else if (type === "past") {
            whereClause.createdAt = {
                lt: startOfToday
            };
            whereClause.status = "DELIVERED";
        } else if (type === "all") {
            // No additional filter
        }

        if (!withDrinks) {
            whereClause.sale = { items: { some: { product: { type: "FOOD" } } } };
        }

        const orders = await prisma.kitchenOrder.findMany({
            where: whereClause,
            include: {
                sale: {
                    include: {
                        items: {
                            include: {
                                product: true
                            }
                        },
                        client: {
                            select: { name: true }
                        },
                        // Who took the order (shown and filterable on the kitchen screens)
                        user: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: [
                { priority: 'desc' }, // High priority first
                { createdAt: 'asc' }  // Oldest first
            ]
        });

        return NextResponse.json({ success: true, data: orders });
    } catch (error: any) {
        console.error("Kitchen API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

const ACTIVE = ["PENDING", "IN_PREPARATION", "READY"] as const;

/** Which orders a bulk action applies to. */
function scopeWhere(scope: string | null): any | null {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (scope) {
        case "all":
            return {};
        case "active":
            return { status: { in: [...ACTIVE] } };
        case "drinks":
            // Orders without any dish: drinks only.
            return { sale: { items: { none: { product: { type: "FOOD" } } } } };
        case "before-today":
            return { createdAt: { lt: startOfToday } };
        case "done":
            return { status: "DELIVERED" };
        default:
            return null;
    }
}

async function managerSession() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    return role === "ADMIN" || role === "MANAGER" ? session : null;
}

/**
 * Bulk delete: DELETE /api/kitchen/orders?scope=all|active|drinks|before-today|done
 * Only the kitchen tickets are removed; the sales, payments and stock stay untouched.
 */
export async function DELETE(request: NextRequest) {
    try {
        if (!(await managerSession())) {
            return NextResponse.json({ success: false, error: "Réservé aux administrateurs et gérants" }, { status: 403 });
        }
        const where = scopeWhere(new URL(request.url).searchParams.get("scope"));
        if (!where) {
            return NextResponse.json({ success: false, error: "Portée invalide" }, { status: 400 });
        }
        const { count } = await prisma.kitchenOrder.deleteMany({ where });
        return NextResponse.json({ success: true, count });
    } catch (error: any) {
        console.error("Kitchen bulk delete error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * Bulk complete: PATCH /api/kitchen/orders  { scope } -> marks the matching active orders as served.
 */
export async function PATCH(request: NextRequest) {
    try {
        if (!(await managerSession())) {
            return NextResponse.json({ success: false, error: "Réservé aux administrateurs et gérants" }, { status: 403 });
        }
        const { scope } = await request.json().catch(() => ({ scope: null }));
        const where = scopeWhere(scope ?? "active");
        if (!where) {
            return NextResponse.json({ success: false, error: "Portée invalide" }, { status: 400 });
        }
        const { count } = await prisma.kitchenOrder.updateMany({
            where: { ...where, status: { in: [...ACTIVE] } },
            data: { status: "DELIVERED", deliveredAt: new Date() },
        });
        return NextResponse.json({ success: true, count });
    } catch (error: any) {
        console.error("Kitchen bulk complete error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
