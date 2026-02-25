import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";

const CACHE_KEY = "exchange_rate:active";
const CACHE_TTL = 60_000; // 60 seconds

export async function GET() {
    try {
        const data = await cache.get(
            CACHE_KEY,
            async () => {
                const exchangeRate = await prisma.exchangeRate.findFirst({
                    where: { active: true },
                    orderBy: { effectiveDate: "desc" },
                });
                return exchangeRate ?? { rateUsdToCdf: 2850 };
            },
            CACHE_TTL
        );

        return NextResponse.json({ success: true, data });
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

        // Bust the cache so the next GET returns the fresh rate immediately
        cache.invalidate(CACHE_KEY);

        return NextResponse.json({ success: true, data: newRate });
    } catch (error) {
        console.error("Error updating exchange rate:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update exchange rate" },
            { status: 500 }
        );
    }
}
