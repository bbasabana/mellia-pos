import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("query");

        const whereClause: any = {};

        if (query) {
            whereClause.OR = [
                { name: { contains: query, mode: "insensitive" } },
                { phone: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
            ];
        }

        const clients = await prisma.client.findMany({
            where: whereClause,
            orderBy: { updatedAt: "desc" },
            take: 50, // Limit for performance
        });

        return NextResponse.json(clients);
    } catch (error) {
        console.error("[CLIENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, phone, email, notes } = body;

        if (!name || (!phone && !email)) {
            return new NextResponse("Name and at least one contact method (phone/email) are required", { status: 400 });
        }

        // Check availability
        if (phone) {
            const existing = await prisma.client.findUnique({ where: { phone } });
            if (existing) {
                return new NextResponse("Client with this phone already exists", { status: 409 });
            }
        }

        const client = await prisma.client.create({
            data: {
                name,
                phone,
                email,
                notes,
            },
        });

        return NextResponse.json(client);
    } catch (error) {
        console.error("[CLIENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
