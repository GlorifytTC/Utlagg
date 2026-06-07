import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { integrationTokens } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  await db
    .delete(integrationTokens)
    .where(and(eq(integrationTokens.userId, session.user.id), eq(integrationTokens.provider, "fortnox")));
  await logAudit({ userId: session.user.id, action: "integration.fortnox.disconnect", ipAddress: clientIp(req) });
  return NextResponse.json({ ok: true });
}
