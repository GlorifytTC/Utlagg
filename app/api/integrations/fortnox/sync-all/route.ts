import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { integrationTokens, receipts } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { pushReceiptToFortnox } from "@/lib/fortnox";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Push all of the user's not-yet-synced receipts to Fortnox as vouchers. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const [token] = await db
    .select()
    .from(integrationTokens)
    .where(and(eq(integrationTokens.userId, session.user.id), eq(integrationTokens.provider, "fortnox")))
    .limit(1);
  if (!token) return NextResponse.json({ error: "Fortnox är inte kopplat" }, { status: 409 });

  const pending = await db
    .select()
    .from(receipts)
    .where(and(eq(receipts.userId, session.user.id), eq(receipts.fortnoxSynced, false)));

  let synced = 0;
  let failed = 0;
  for (const r of pending) {
    try {
      const result = (await pushReceiptToFortnox(r, token.accessToken)) as {
        Voucher?: { VoucherNumber?: string | number };
      };
      const voucherId = result?.Voucher?.VoucherNumber;
      await db
        .update(receipts)
        .set({
          fortnoxSynced: true,
          fortnoxSyncedAt: new Date(),
          fortnoxVoucherId: voucherId != null ? String(voucherId) : null,
        })
        .where(eq(receipts.id, r.id));
      synced++;
    } catch (err) {
      console.error("fortnox sync failed for", r.id, err);
      failed++;
    }
  }

  await logAudit({
    userId: session.user.id,
    action: "integration.fortnox.sync_all",
    details: `synced ${synced}, failed ${failed}`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ synced, failed, total: pending.length });
}
