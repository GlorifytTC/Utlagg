import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { integrationTokens, receipts } from "@/db/schema";
import { pushReceiptToFortnox } from "@/lib/fortnox";
import { logAudit, clientIp } from "@/lib/audit";
import { requireFeature } from "@/lib/entitlements";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Push all of the user's not-yet-synced receipts to Fortnox as vouchers. */
export async function POST(req: NextRequest) {
  const gate = await requireFeature("fortnox");
  if (gate.status === 401) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (!gate.ok)
    return NextResponse.json(
      { error: "Fortnox-integration ingår i Pro-planen.", upgrade: true },
      { status: 403 },
    );
  const userId = gate.userId!;

  const [token] = await db
    .select()
    .from(integrationTokens)
    .where(and(eq(integrationTokens.userId, userId), eq(integrationTokens.provider, "fortnox")))
    .limit(1);
  if (!token) return NextResponse.json({ error: "Fortnox är inte kopplat" }, { status: 409 });

  const pending = await db
    .select()
    .from(receipts)
    .where(and(eq(receipts.userId, userId), eq(receipts.fortnoxSynced, false)));

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
    userId,
    action: "integration.fortnox.sync_all",
    details: `synced ${synced}, failed ${failed}`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ synced, failed, total: pending.length });
}
