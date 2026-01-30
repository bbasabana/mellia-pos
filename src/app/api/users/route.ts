
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { hash } from "bcryptjs";

// GET: List all users
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Only Admin/Manager should see this
        const userRole = (session.user as any).role;
        if (userRole !== "ADMIN" && userRole !== "MANAGER") {
            return NextResponse.json({ error: "Permission refused" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                baseSalary: true,
                phone: true,
                createdAt: true,
                // Include summary of current month payroll status if needed
            },
            orderBy: { name: 'asc' }
        });

        // Calculate "Current Month Advances" for each user
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const advances = await prisma.salaryAdvance.groupBy({
            by: ['userId'],
            _sum: { amount: true },
            where: {
                date: { gte: startOfMonth, lte: endOfMonth },
                status: { in: ['APPROVED', 'PAID'] } // Only count approved/paid advances
            }
        });

        const usersWithStats = users.map(user => {
            const userAdvances = advances.find(a => a.userId === user.id);
            return {
                ...user,
                currentMonthAdvances: userAdvances?._sum.amount || 0
            };
        });

        return NextResponse.json({ success: true, data: usersWithStats });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}

// POST: Create User
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;

        if (userRole !== "ADMIN") {
            return NextResponse.json({ error: "Permission refused" }, { status: 403 });
        }

        const body = await req.json();
        const { name, email, role, baseSalary, phone, password } = body;

        // Use provided password if valid (min 4 chars), otherwise generate random
        let finalPassword = password;
        if (!finalPassword || finalPassword.length < 4) {
            finalPassword = Math.random().toString(36).slice(-8);
        }

        const passwordHash = await hash(finalPassword, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: role || "CASHIER",
                status: "ACTIVE",
                baseSalary: baseSalary ? parseFloat(baseSalary) : null,
                phone
            }
        });

        return NextResponse.json({ success: true, data: { ...newUser, generatedPassword: finalPassword } });

    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
