import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
        }

        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ success: false, error: "Status requis" }, { status: 400 });
        }

        // Update order
        const order = await prisma.kitchenOrder.update({
            where: { id: params.id },
            data: {
                status: status,
                ...(status === 'IN_PREPARATION' && {
                    preparedBy: (session.user as any).id,
                    preparedAt: new Date() // Start time
                }),
                ...(status === 'READY' && {
                    // Update preparedBy if not set?
                }),
                ...(status === 'DELIVERED' && {
                    deliveredAt: new Date()
                })
            }
        });

        // Optional: If status is READY, maybe notify waiters? (Future feature)

        return NextResponse.json({ success: true, data: order });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
