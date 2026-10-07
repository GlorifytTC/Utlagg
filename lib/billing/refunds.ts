import "server-only";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { scanCredits, accountantBoosts } from "@/db/schema";
import { logAudit } from "@/lib/audit";

const id = (x: string | { id: string } | null | undefined) =>
  typeof x === "string" ? x : (x?.id ?? null);

/**
 * Reverse what a fully refunded charge bought. Called from the
 * `charge.refunded` webhook so dashboard refunds and admin-button refunds share
 * one path. Every step is idempotent (the webhook may replay).
 *
 * ponytail: partial refunds are ignored (no pro-rata entitlement), revoke by
 * hand. Already-spent credit scans stay spent.
 */
export async function reverseRefundedCharge(charge: Stripe.Charge): Promise<void> {
  if (!charge.refunded) return;

  // One-off purchases: map charge → checkout session via the payment intent.
  const pi = id(charge.payment_intent);
  if (pi) {
    const [session] = (await stripe.checkout.sessions.list({ payment_intent: pi, limit: 1 })).data;
    if (session?.metadata?.kind === "credit_pack") {
      await db.update(scanCredits).set({ scansRemaining: 0 }).where(eq(scanCredits.stripeRef, session.id));
      await logAudit({
        userId: session.metadata.userId ?? null,
        action: "billing.credit_pack_refunded",
        details: `charge=${charge.id} session=${session.id}`,
      });
      return;
    }
    if (session?.metadata?.kind === "accountant_boost") {
      await db
        .update(accountantBoosts)
        .set({ status: "cancelled" })
        .where(eq(accountantBoosts.stripeCheckoutSessionId, session.id));
      await logAudit({
        userId: session.metadata.accountantId ?? null,
        action: "billing.boost_refunded",
        details: `charge=${charge.id} session=${session.id}`,
      });
      return;
    }
  }

  // Subscription payment: cut access only if this was the CURRENT invoice. The
  // resulting customer.subscription.deleted event runs the normal downgrade
  // (read-only, data kept).
  const invoiceId = id(charge.invoice);
  if (!invoiceId) return;
  const invoice = await stripe.invoices.retrieve(invoiceId);
  const subId = id(invoice.subscription);
  if (!subId) return;
  const sub = await stripe.subscriptions.retrieve(subId);
  if (sub.status === "canceled" || id(sub.latest_invoice) !== invoiceId) return;
  await stripe.subscriptions.cancel(subId);
  await logAudit({
    userId: null,
    action: "billing.subscription_refunded",
    details: `charge=${charge.id} sub=${subId}`,
  });
}
