import "server-only";
import { and, desc, eq, gt, isNull, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { scanUsage, subscriptions, companyMembers } from "@/db/schema";
import { stripe } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";
import { pricingV2Enabled } from "@/lib/billing/config";

/**
 * End-of-cycle overage billing (spec §3.1) + upgrade nudge (spec §3.5).
 *
 * Overage accrues per scan into scan_usage.overageBilledOre during the period
 * (metering.ts). We report it to Stripe ONCE per period, at close-out, as a
 * single invoice item in öre — this fits the app's existing fixed-price
 * subscription model (no metered price plumbing required) and is naturally
 * idempotent via the overageFlushedAt marker.
 *
 * Called from the monthly reset cron. Safe to re-run: already-flushed periods
 * are skipped.
 */

/** Resolve the Stripe customer that should be billed for a billing account. */
async function customerForScope(
  scope: "user" | "company",
  scopeId: string,
): Promise<string | null> {
  if (scope === "user") {
    const [s] = await db
      .select({ c: subscriptions.stripeCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, scopeId))
      .limit(1);
    return s?.c ?? null;
  }
  // Company scope: bill the owner's subscription (the account that pays).
  const [owner] = await db
    .select({ userId: companyMembers.userId })
    .from(companyMembers)
    .where(and(eq(companyMembers.companyId, scopeId), eq(companyMembers.role, "owner")))
    .limit(1);
  if (!owner) return null;
  const [s] = await db
    .select({ c: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, owner.userId))
    .limit(1);
  return s?.c ?? null;
}

/** Did the period immediately before `row` also incur overage? (nudge trigger) */
async function priorPeriodHadOverage(row: {
  scope: "user" | "company";
  scopeId: string;
  periodStart: Date;
}): Promise<boolean> {
  const [prev] = await db
    .select({ ore: scanUsage.overageBilledOre })
    .from(scanUsage)
    .where(
      and(
        eq(scanUsage.scope, row.scope),
        eq(scanUsage.scopeId, row.scopeId),
        lt(scanUsage.periodStart, row.periodStart),
      ),
    )
    .orderBy(desc(scanUsage.periodStart))
    .limit(1);
  return (prev?.ore ?? 0) > 0;
}

export async function closeOutEndedPeriods(
  now: Date = new Date(),
): Promise<{ flushed: number; nudged: number }> {
  if (!pricingV2Enabled()) return { flushed: 0, nudged: 0 };

  const due = await db
    .select()
    .from(scanUsage)
    .where(
      and(
        lte(scanUsage.periodEnd, now),
        gt(scanUsage.overageBilledOre, 0),
        isNull(scanUsage.overageFlushedAt),
      ),
    );

  let flushed = 0;
  let nudged = 0;

  for (const row of due) {
    // Claim the row first (idempotent): only proceed if still unflushed.
    const claimed = await db
      .update(scanUsage)
      .set({ overageFlushedAt: now, updatedAt: now })
      .where(and(eq(scanUsage.id, row.id), isNull(scanUsage.overageFlushedAt)))
      .returning({ id: scanUsage.id });
    if (claimed.length === 0) continue;

    const customer = await customerForScope(row.scope, row.scopeId);
    if (customer) {
      try {
        await stripe.invoiceItems.create({
          customer,
          amount: row.overageBilledOre, // öre
          currency: "sek",
          description: `Extra skanningar ${row.periodStart
            .toISOString()
            .slice(0, 10)} – ${row.periodEnd.toISOString().slice(0, 10)} (${row.overageScansUsed} st)`,
        });
        flushed++;
      } catch (e) {
        // Un-claim so a later run retries rather than silently dropping revenue.
        await db
          .update(scanUsage)
          .set({ overageFlushedAt: null })
          .where(eq(scanUsage.id, row.id));
        console.error("overage invoice item failed:", e);
        continue;
      }
    }

    // Upgrade nudge: overage in two consecutive periods → surface a prompt.
    if (await priorPeriodHadOverage(row)) {
      nudged++;
      await logAudit({
        userId: row.scope === "user" ? row.scopeId : null,
        action: "billing.upgrade_nudge",
        details: `scope=${row.scope}:${row.scopeId} consecutive overage — suggest next tier`,
      });
      // TODO(pricing-v2): also send the "upgrade to the next tier" email via
      // lib/email.ts once the template exists.
    }
  }

  return { flushed, nudged };
}
