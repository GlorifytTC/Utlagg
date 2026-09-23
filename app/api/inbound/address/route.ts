/**
 * Returns the caller's personal receipt-forwarding address, generating the
 * inbound token lazily on first request. The address is
 * kvitto+<token>@<INBOUND_EMAIL_DOMAIN>; forwarding an email receipt or a Kivra
 * PDF there ingests it without OCR (see app/api/inbound/email/route.ts).
 */
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  const domain = process.env.INBOUND_EMAIL_DOMAIN;
  if (!domain) {
    // Feature not provisioned (no inbound domain configured) — tell the UI so
    // it can hide the card rather than show a broken address.
    return NextResponse.json({ enabled: false });
  }

  const [row] = await db
    .select({ inboundToken: users.inboundToken })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  let token = row?.inboundToken ?? null;
  if (!token) {
    token = crypto.randomBytes(16).toString("hex"); // 32 hex chars
    await db.update(users).set({ inboundToken: token }).where(eq(users.id, session.user.id));
  }

  return NextResponse.json({ enabled: true, address: `kvitto+${token}@${domain}` });
}
