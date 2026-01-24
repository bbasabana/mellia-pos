import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

// Temporary: Since we don't have proper session handling in this context yet,
// we'll assume the interaction is for the main admin user (or the first user found).
// In a real app, you'd get the user ID from the session.
async function getUserId() {
    const user = await prisma.user.findFirst();
    return user?.id;
}

export async function GET() {
    try {
        const userId = await getUserId();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                // Don't send password hash
            }
        });

        return NextResponse.json({
            success: true,
            data: user,
        });

    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const userId = await getUserId();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { name, email, password } = body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (password && password.length >= 6) {
            updateData.passwordHash = await hashPassword(password);
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            }
        });

        return NextResponse.json({
            success: true,
            data: user,
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
