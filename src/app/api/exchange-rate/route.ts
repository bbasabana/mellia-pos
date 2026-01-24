import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const exchangeRate = await prisma.exchangeRate.findFirst({
            where: { active: true },
            orderBy: { effectiveDate: "desc" },
        });

        if (!exchangeRate) {
            // Default fallback if no rate is set in database
            return NextResponse.json({
                success: true,
                data: { rateUsdToCdf: 2850 },
            });
        }

        return NextResponse.json({
            success: true,
            data: exchangeRate,
        });
    } catch (error) {
        console.error("Error fetching exchange rate:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch exchange rate" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { rateUsdToCdf } = body;

        if (!rateUsdToCdf || isNaN(parseFloat(rateUsdToCdf))) {
            return NextResponse.json(
                { success: false, error: "Invalid exchange rate" },
                { status: 400 }
            );
        }

        // Deactivate previous rates
        await prisma.exchangeRate.updateMany({
            where: { active: true },
            data: { active: false },
        });

        // Create new rate
        const newRate = await prisma.exchangeRate.create({
            data: {
                rateUsdToCdf: parseFloat(rateUsdToCdf),
                active: true,
                effectiveDate: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            data: newRate,
        });
    } catch (error) {
        console.error("Error updating exchange rate:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update exchange rate" },
            { status: 500 }
        );
    }
}
