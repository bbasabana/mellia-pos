import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;

        if (userRole !== "ADMIN" && userRole !== "MANAGER") {
            return NextResponse.json(
                { success: false, error: "Permission refusée" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, phone, email, notes } = body;

        const updatedClient = await prisma.client.update({
            where: { id: params.id },
            data: {
                name,
                phone,
                email,
                notes
            }
        });

        return NextResponse.json({ success: true, data: updatedClient });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;

        if (userRole !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Permission refusée" },
                { status: 403 }
            );
        }

        await prisma.client.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
