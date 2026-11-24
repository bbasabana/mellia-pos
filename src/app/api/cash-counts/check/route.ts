import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkOpenDay } from "@/lib/cash-check";

/**
 * GET ?counted=241500: checks the open day before it is closed — possible duplicates,
 * tickets whose total equals the shortfall, payments that are not cash, prices typed by
 * hand, cancelled tickets and drawer expenses. Nothing is written.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const raw = new URL(req.url).searchParams.get("counted");
    const counted = raw === null || raw === "" ? null : Math.round(Number(raw));
    const data = await checkOpenDay(counted !== null && Number.isFinite(counted) ? counted : null);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[CASH_COUNTS_CHECK_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
