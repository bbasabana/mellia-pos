import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sanitizeClosedDays } from "@/lib/closed-days";
import { CLOSED_DAYS_ENTITY, getClosedDays } from "@/lib/closed-days-store";

type SessionUser = { id?: string; role?: string };

/** GET: the closed days (every week, and holidays). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  try {
    return NextResponse.json({ success: true, data: await getClosedDays() });
  } catch (error) {
    console.error("[CLOSED_DAYS_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/** PUT {weekdays, dates}: the administrator sets the closed days. Each change is kept. */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });
  if (user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Réservé à l'administrateur" }, { status: 403 });
  }
  try {
    const cfg = sanitizeClosedDays(await req.json());
    // Written directly (not through createAuditLog, which never fails): the setting must be saved.
    await prisma.auditLog.create({ data: { userId: user.id, action: "SETTINGS", entity: CLOSED_DAYS_ENTITY, metadata: cfg } });
    return NextResponse.json({ success: true, data: await getClosedDays() });
  } catch (error) {
    console.error("[CLOSED_DAYS_PUT]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
