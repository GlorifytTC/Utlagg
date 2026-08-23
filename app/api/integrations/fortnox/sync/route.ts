import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { integrationTokens, receipts } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { pushReceiptToFortnox } from "@/lib/fortnox";
import { logAudit, clientIp } from "@/lib/audit";
import { assertExportAllowed } from "@/lib/billing/export-gating";

export const runtime = "nodejs";

const schema = z.object({ receiptId: z.string().uuid() });

/** Push one owned receipt to Fortnox as a voucher. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  // Export gating (spec §C): pushing to an accounting integration is a gated
  // export format — blocked in read-only / lapsed state (CSV + original files
  // remain available instead).
  const gate = await assertExportAllowed(session.user.id, "integration_fortnox");
  if (!gate.allowed) {
    return NextResponse.json(
      { error: gate.message, code: gate.reason, fallback: gate.fallback },
      { status: 403 },
    );
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "receiptId saknas" }, { status: 400 });
  }
  const userId = session.user.id;

  const [token] = await db
    .select()
    .from(integrationTokens)
    .where(
      and(
        eq(integrationTokens.userId, userId),
        eq(integrationTokens.provider, "fortnox"),
      ),
    )
    .limit(1);
  if (!token) {
    return NextResponse.json(
      { error: "Fortnox är inte kopplat." },
      { status: 409 },
    );
  }

  const [receipt] = await db
    .select()
    .from(receipts)
    .where(and(eq(receipts.id, parsed.data.receiptId), eq(receipts.userId, userId)))
    .limit(1);
  if (!receipt) {
    return NextResponse.json({ error: "Kvitto saknas" }, { status: 404 });
  }

  try {
    const result = await pushReceiptToFortnox(receipt, token.accessToken);
    await logAudit({
      userId,
      action: "integration.fortnox.sync",
      details: `Receipt ${receipt.id} pushed to Fortnox`,
      ipAddress: clientIp(req),
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("fortnox sync error:", err);
    // 401 from Fortnox usually means the access token expired -> refresh needed.
    return NextResponse.json(
      { error: "Synk mot Fortnox misslyckades (token kan behöva förnyas)." },
      { status: 502 },
    );
  }
}
