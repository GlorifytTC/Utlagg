import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { integrationTokens } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { exchangeFortnoxCode } from "@/lib/fortnox";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state?.startsWith(session.user.id + ".")) {
    return NextResponse.json({ error: "Ogiltig callback" }, { status: 400 });
  }

  try {
    const tokens = await exchangeFortnoxCode(code);
    const userId = session.user.id;
    const expiresAt = tokens.expiresInSeconds
      ? new Date(Date.now() + tokens.expiresInSeconds * 1000)
      : null;

    const [existing] = await db
      .select({ id: integrationTokens.id })
      .from(integrationTokens)
      .where(
        and(
          eq(integrationTokens.userId, userId),
          eq(integrationTokens.provider, "fortnox"),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(integrationTokens)
        .set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          scope: tokens.scope,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(integrationTokens.id, existing.id));
    } else {
      await db.insert(integrationTokens).values({
        userId,
        provider: "fortnox",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        scope: tokens.scope,
        expiresAt,
      });
    }

    await logAudit({
      userId,
      action: "integration.fortnox.connect",
      ipAddress: clientIp(req),
    });

    return NextResponse.redirect(new URL("/dashboard?fortnox=connected", req.url));
  } catch (err) {
    console.error("fortnox callback error:", err);
    return NextResponse.json(
      { error: "Kunde inte koppla Fortnox." },
      { status: 502 },
    );
  }
}
