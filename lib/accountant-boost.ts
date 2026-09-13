import "server-only";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { accountantBoosts } from "@/db/schema";

/**
 * Accountant Boost — server-side entitlement logic.
 *
 * Product: 49 kr, 7 days, ONE-TIME payment (not a subscription). The price and
 * duration are fixed here on the server; the browser can only ask to "buy
 * Boost" and never influences amount/currency/duration.
 */
export const BOOST_PRICE_ORE = 4900; // 49 kr
export const BOOST_CURRENCY = "sek";
export const BOOST_DURATION_DAYS = 7;

export interface BoostState {
  active: boolean;
  expiresAt: string | null;
  daysLeft: number | null;
}

/**
 * The authoritative boost state for an accountant. A boost counts as active iff
 * status='active' AND expiresAt > now() — evaluated at query time, so ranking
 * correctness never depends on a cron marking rows expired.
 */
export async function getBoostState(accountantId: string): Promise<BoostState> {
  const [row] = await db
    .select({ expiresAt: accountantBoosts.expiresAt, status: accountantBoosts.status })
    .from(accountantBoosts)
    .where(
      and(
        eq(accountantBoosts.accountantId, accountantId),
        eq(accountantBoosts.status, "active"),
        gt(accountantBoosts.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(accountantBoosts.expiresAt))
    .limit(1);

  if (!row?.expiresAt) return { active: false, expiresAt: null, daysLeft: null };
  const ms = new Date(row.expiresAt).getTime() - Date.now();
  return {
    active: true,
    expiresAt: new Date(row.expiresAt).toISOString(),
    daysLeft: Math.max(0, Math.ceil(ms / 86_400_000)),
  };
}

/** True iff the accountant currently has an active, unexpired boost. */
export async function isBoostActive(accountantId: string): Promise<boolean> {
  return (await getBoostState(accountantId)).active;
}

/**
 * Activates a boost from a VERIFIED Stripe webhook. Idempotent on the checkout
 * session id (unique index) — a replayed webhook updates the same row rather
 * than creating a second boost. Never called from the browser or success URL.
 */
export async function activateBoostFromWebhook(params: {
  accountantId: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  amount: number | null;
  currency: string | null;
}): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + BOOST_DURATION_DAYS * 86_400_000);

  // Was this session already processed? (idempotency)
  const [existing] = await db
    .select({ id: accountantBoosts.id, status: accountantBoosts.status })
    .from(accountantBoosts)
    .where(eq(accountantBoosts.stripeCheckoutSessionId, params.checkoutSessionId))
    .limit(1);

  if (existing) {
    // Already activated by a prior delivery of this event → no-op.
    if (existing.status === "active") return;
    await db
      .update(accountantBoosts)
      .set({
        status: "active",
        stripePaymentIntentId: params.paymentIntentId,
        amount: params.amount,
        currency: params.currency,
        startsAt: now,
        expiresAt,
      })
      .where(eq(accountantBoosts.id, existing.id));
    return;
  }

  await db.insert(accountantBoosts).values({
    accountantId: params.accountantId,
    status: "active",
    stripeCheckoutSessionId: params.checkoutSessionId,
    stripePaymentIntentId: params.paymentIntentId,
    amount: params.amount,
    currency: params.currency,
    startsAt: now,
    expiresAt,
  });
}

/**
 * Deterministic accountant ranking: relevance FIRST, boost SECOND. `relevance`
 * is a caller-computed score (location/specialty/etc). A boost only breaks ties
 * or lifts an accountant above a COMPARABLE non-boosted one — it never
 * overrides a materially more relevant result, because relevance is the primary
 * sort key. Used wherever accountants are shown to companies.
 */
export function rankAccountants<T extends { accountantId: string; relevance: number }>(
  items: T[],
  boostedIds: Set<string>,
): T[] {
  return [...items].sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance; // relevance first
    const ab = boostedIds.has(a.accountantId) ? 1 : 0;
    const bb = boostedIds.has(b.accountantId) ? 1 : 0;
    if (bb !== ab) return bb - ab; // boost second (tie-breaker within same relevance)
    return a.accountantId.localeCompare(b.accountantId); // stable final tie-break
  });
}
