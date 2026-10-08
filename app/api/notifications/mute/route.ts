import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMutes, users } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GET -> { global, clients[] } mute state for the caller. */
export async function GET() {
  const session = await getServerSession(authOptions);
  const me = session?.user?.id;
  if (!me) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const [u] = await db.select({ muted: users.notifSoundMuted }).from(users).where(eq(users.id, me)).limit(1);
  const rows = await db.select({ id: chatMutes.clientId }).from(chatMutes).where(eq(chatMutes.userId, me));
  return NextResponse.json({ global: !!u?.muted, clients: rows.map((r: { id: string }) => r.id) });
}

/** PATCH { muted, clientId? } - no clientId = global sound mute, else per-chat mute. */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const me = session?.user?.id;
  if (!me) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const clientId = body?.clientId;
  if (typeof body?.muted !== "boolean" || (clientId !== undefined && !(typeof clientId === "string" && UUID.test(clientId)))) {
    return NextResponse.json({ error: "Ogiltig förfrågan" }, { status: 400 });
  }

  if (clientId === undefined) {
    await db.update(users).set({ notifSoundMuted: body.muted }).where(eq(users.id, me));
  } else if (body.muted) {
    // Row only affects the caller's own notifications; FK rejects unknown ids.
    try {
      await db.insert(chatMutes).values({ userId: me, clientId }).onConflictDoNothing();
    } catch {
      return NextResponse.json({ error: "Hittades inte" }, { status: 404 });
    }
  } else {
    await db.delete(chatMutes).where(and(eq(chatMutes.userId, me), eq(chatMutes.clientId, clientId)));
  }
  return NextResponse.json({ ok: true });
}
