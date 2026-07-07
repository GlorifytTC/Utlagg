import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { stripe, tierFromPriceId } from "@/lib/stripe";
import { db } from "@/db";
import { users, subscriptions, webhookEvents } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import {
  sendWelcomeEmail,
  sendPaymentReceipt,
  sendPaymentFailed,
} from "@/lib/email";
import { planForTier, type Tier } from "@/lib/plans";

export const runtime = "nodejs";
// Stripe needs the raw body for signature verification — don't let Next parse it.
export const dynamic = "force-dynamic";

const SCAN_LIMITS: Record<string, number> = {
  free: 25,
  pro: -1,
  business: -1,
  enterprise: -1,
};

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error("stripe signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    // Idempotency: skip events we've already processed (Stripe may resend).
    try {
      await db.insert(webhookEvents).values({ id: event.id, type: event.type });
    } catch {
      // Duplicate primary key -> already handled; ack and return.
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const sessionObj = event.data.object as Stripe.Checkout.Session;
        const email =
          sessionObj.customer_details?.email ??
          sessionObj.customer_email ??
          null;
        if (email) {
          const name = sessionObj.customer_details?.name ?? "där";
          await sendWelcomeEmail(email, name);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await downgradeToFree(sub);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(invoice);
        break;
      }
      default:
        // Ignore unhandled event types.
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("stripe webhook handling error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}

async function findUserByCustomer(customerId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);
  return sub?.userId ?? null;
}

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price.id;
  const tier = (tierFromPriceId(priceId) ?? "free") as
    | "free"
    | "pro"
    | "business"
    | "enterprise";

  const status = (sub.status === "active" || sub.status === "trialing"
    ? "active"
    : sub.status === "past_due"
      ? "past_due"
      : "canceled") as "active" | "past_due" | "canceled";

  const userId = await findUserByCustomer(customerId);
  if (!userId) {
    console.warn("No user mapped to Stripe customer", customerId);
    return;
  }

  await db
    .update(subscriptions)
    .set({
      stripeSubscriptionId: sub.id,
      tier,
      status,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));

  await db
    .update(users)
    .set({
      subscriptionTier: tier,
      subscriptionStatus: status,
      subscriptionSource: tier === "free" ? null : "stripe",
      scanLimit: SCAN_LIMITS[tier] ?? 25,
    })
    .where(eq(users.id, userId));

  await logAudit({
    userId,
    action: "subscription.sync",
    details: `tier=${tier} status=${status}`,
  });
}

async function findUserRowByCustomer(customerId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);
  if (!sub) return null;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, sub.userId))
    .limit(1);
  return user ?? null;
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;
  if (!customerId) return;

  const user = await findUserRowByCustomer(customerId);
  if (!user) {
    console.warn("No user mapped to Stripe customer", customerId);
    return;
  }

  // A paid invoice means the account is in good standing again (this also
  // clears past_due after a successful retry).
  await db
    .update(subscriptions)
    .set({ status: "active" })
    .where(eq(subscriptions.stripeCustomerId, customerId));
  await db
    .update(users)
    .set({ subscriptionStatus: "active" })
    .where(eq(users.id, user.id));

  await logAudit({
    userId: user.id,
    action: "subscription.invoice_paid",
    details: `invoice=${invoice.id} amount=${invoice.amount_paid}`,
  });

  // Receipt email — skip 0 kr invoices (trials, 100% coupons).
  if (invoice.amount_paid > 0 && user.email) {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const plan = planForTier(user.subscriptionTier as Tier);
    await sendPaymentReceipt(user.email, {
      userName: user.name ?? "där",
      planName: plan.name,
      amount: `${(invoice.amount_paid / 100).toLocaleString("sv-SE")} kr`,
      billingDate: new Date(invoice.created * 1000).toLocaleDateString("sv-SE"),
      actionUrl: invoice.hosted_invoice_url ?? `${baseUrl}/dashboard/subscription`,
    });
  }
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;
  if (!customerId) return;

  const user = await findUserRowByCustomer(customerId);
  if (!user) return;

  await db
    .update(subscriptions)
    .set({ status: "past_due" })
    .where(eq(subscriptions.stripeCustomerId, customerId));
  await db
    .update(users)
    .set({ subscriptionStatus: "past_due" })
    .where(eq(users.id, user.id));

  await logAudit({
    userId: user.id,
    action: "subscription.payment_failed",
    details: `invoice=${invoice.id} attempt=${invoice.attempt_count}`,
  });

  if (user.email) {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const plan = planForTier(user.subscriptionTier as Tier);
    await sendPaymentFailed(user.email, {
      userName: user.name ?? "där",
      planName: plan.name,
      actionUrl: invoice.hosted_invoice_url ?? `${baseUrl}/dashboard/subscription`,
    });
  }
}

async function downgradeToFree(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = await findUserByCustomer(customerId);
  if (!userId) return;

  await db
    .update(users)
    .set({
      subscriptionTier: "free",
      subscriptionStatus: "canceled",
      scanLimit: 25,
    })
    .where(eq(users.id, userId));

  await logAudit({
    userId,
    action: "subscription.canceled",
    details: `Stripe sub ${sub.id} deleted`,
  });
}
