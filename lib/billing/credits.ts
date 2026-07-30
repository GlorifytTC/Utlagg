import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scanCredits } from "@/db/schema";
import { CREDIT_PACK } from "@/lib/billing/config";
import { resolveBillingContext } from "@/lib/billing/scope";
import { logAudit } from "@/lib/audit";

/**
 * Purchased credit packs (spec §3.3). Credits roll over and must not expire for
 * at least 12 months (consumer law) — set expiry to purchase + CREDIT_PACK
 * .validMonths. Grants are keyed by the Stripe reference so replaying the
 * purchase webhook can never grant the same pack twice.
 */

function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

export async function grantCreditPack(input: {
  userId: string;
  stripeRef: string;
  scans?: number;
  priceOre?: number;
}): Promise<{ granted: boolean }> {
  const ctx = await resolveBillingContext(input.userId);
  if (!ctx) return { granted: false };

  const scans = input.scans ?? CREDIT_PACK.scans;
  const priceOre = input.priceOre ?? CREDIT_PACK.priceOre;
  const now = new Date();

  const inserted = await db
    .insert(scanCredits)
    .values({
      scope: ctx.scope,
      scopeId: ctx.scopeId,
      scansTotal: scans,
      scansRemaining: scans,
      priceOre,
      purchasedAt: now,
      expiresAt: addMonths(now, CREDIT_PACK.validMonths),
      stripeRef: input.stripeRef,
    })
    .onConflictDoNothing({ target: scanCredits.stripeRef })
    .returning({ id: scanCredits.id });

  if (inserted.length === 0) return { granted: false }; // replay — already granted

  await logAudit({
    userId: input.userId,
    action: "billing.credit_pack_granted",
    details: `scope=${ctx.scope}:${ctx.scopeId} scans=${scans} ref=${input.stripeRef}`,
  });
  return { granted: true };
}
