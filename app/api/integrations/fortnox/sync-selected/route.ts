import { NextResponse, type NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { integrationTokens, receipts } from "@/db/schema";
import { pushReceiptToFortnox } from "@/lib/fortnox";
import { logAudit, clientIp } from "@/lib/audit";
import { requireFeature } from "@/lib/entitlements";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({ receiptIds: z.array(z.string().uuid()).min(1).max(200) });

/**
 * Pushes ONLY the receipts the person explicitly picked — replaces the old
 * "sync everything unsynced" behavior so nothing leaves Utlagg without the
 * person reviewing exactly what's being sent first.
 */
export async function POST(req: NextRequest) {
  const gate = await requireFeature("fortnox");
  if (gate.status === 401) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (!gate.ok)
    return NextResponse.json(
      { error: "Fortnox-integration ingår i Pro-planen.", upgrade: true },
      { status: 403 },
    );
  const userId = gate.userId!;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltig begäran" }, { status: 400 });
  }

  const [token] = await db
    .select()
    .from(integrationTokens)
    .where(and(eq(integrationTokens.userId, userId), eq(integrationTokens.provider, "fortnox")))
    .limit(1);
  if (!token) return NextResponse.json({ error: "Fortnox är inte kopplat" }, { status: 409 });

  // Only the person's OWN, approved, not-yet-synced receipts — even if a
  // client sent extra/foreign IDs, this can never push someone else's data
  // or anything still pending approval.
  const selected = await db
    .select()
    .from(receipts)
    .where(
      and(
        eq(receipts.userId, userId),
        eq(receipts.fortnoxSynced, false),
        eq(receipts.status, "approved"),
        inArray(receipts.id, parsed.data.receiptIds),
      ),
    );

  let synced = 0;
  let failed = 0;
  for (const r of selected) {
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
    action: "integration.fortnox.sync_selected",
    details: `requested ${parsed.data.receiptIds.length}, synced ${synced}, failed ${failed}`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ synced, failed, total: selected.length });
}
