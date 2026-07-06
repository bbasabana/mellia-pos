import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildAmelieReport } from "@/lib/amelie-report";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const investmentId = searchParams.get("investmentId")?.trim();
    const data = await buildAmelieReport(investmentId);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Amelie API Error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
