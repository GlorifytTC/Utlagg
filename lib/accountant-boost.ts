import "server-only";
import { and, asc, eq, gt, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { accountantBoosts, users } from "@/db/schema";
import { nextStart, regionKey, type BoostInterval } from "@/lib/boost-schedule";

/**
 * Accountant Boost - server-side entitlement logic.
 *
 * Product: 49 kr, 7 days, ONE-TIME payment (not a subscription). The price and
 * duration are fixed here on the server; the browser can only ask to "buy
 * Boost" and never influences amount/currency/duration/region.
 *
 * Capacity: at most MAX_BOOSTS_PER_REGION boosts run at once per region. A
 * boost paid while the region is full is queued and starts when a place frees
 * up, still running its full BOOST_DURATION_DAYS. Scheduling happens in the
 * verified webhook under a per-region Postgres advisory lock, so even if a
 * thousand accountants pay at the same moment the cap can never be exceeded.
 */
export const BOOST_PRICE_ORE = 4900; // 49 kr
export const BOOST_CURRENCY = "sek";
export const BOOST_DURATION_DAYS = 7;
export const BOOST_DURATION_MS = BOOST_DURATION_DAYS * 86_400_000;

/** Boosts running at the same time in one region. */
export const MAX_BOOSTS_PER_REGION = 10;
/** Sponsored places shown at the top of the marketplace. */
export const SPONSORED_SLOTS = 3;
/** Refuse a purchase if the queued start would be further away than this. */
export const MAX_QUEUE_DAYS = 14;

export { regionKey };

export interface BoostState {
  /** Running now. */
  active: boolean;
  /** Paid and queued: starts at startsAt. */
  scheduled: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  daysLeft: number | null;
  /** Times shown in a sponsored slot. */
  impressions: number;
}

export interface RegionAvailability {
  region: string;
  /** When a boost bought now would start. */
  startsAt: string;
  /** True when it would not start immediately. */
  queued: boolean;
  /** True when the queue is longer than MAX_QUEUE_DAYS: purchase refused. */
  full: boolean;
  running: number;
  cap: number;
}

/** A boost row that is paid and not yet over (running or queued). */
const notOver = (now: Date) =>
  and(eq(accountantBoosts.status, "active"), gt(accountantBoosts.expiresAt, now));

/** A boost row that is running right now. */
export const runningNow = (now: Date) =>
  and(
    notOver(now),
    or(isNull(accountantBoosts.startsAt), lte(accountantBoosts.startsAt, now)),
  );

/** The accountant's current or queued boost. */
export async function getBoostState(accountantId: string, now = new Date()): Promise<BoostState> {
  const [row] = await db
    .select({
      startsAt: accountantBoosts.startsAt,
      expiresAt: accountantBoosts.expiresAt,
      impressions: accountantBoosts.impressions,
    })
    .from(accountantBoosts)
    .where(and(eq(accountantBoosts.accountantId, accountantId), notOver(now)))
    .orderBy(asc(accountantBoosts.startsAt))
    .limit(1);

  if (!row?.expiresAt) {
    return { active: false, scheduled: false, startsAt: null, expiresAt: null, daysLeft: null, impressions: 0 };
  }
  const start = row.startsAt ? new Date(row.startsAt) : null;
  const scheduled = !!start && start.getTime() > now.getTime();
  const ms = new Date(row.expiresAt).getTime() - now.getTime();
  return {
    active: !scheduled,
    scheduled,
    startsAt: start ? start.toISOString() : null,
    expiresAt: new Date(row.expiresAt).toISOString(),
    daysLeft: Math.max(0, Math.ceil(ms / 86_400_000)),
    impressions: Number(row.impressions ?? 0),
  };
}

/** True iff the accountant currently has a running boost. */
export async function isBoostActive(accountantId: string): Promise<boolean> {
  return (await getBoostState(accountantId)).active;
}

/** True iff the accountant has a running OR queued boost (blocks a second purchase). */
export async function hasBoostOrQueued(accountantId: string): Promise<boolean> {
  const s = await getBoostState(accountantId);
  return s.active || s.scheduled;
}

/** Region of an accountant, from their profile city. */
export async function accountantRegion(accountantId: string): Promise<string> {
  const [u] = await db
    .select({ city: users.accountantCity })
    .from(users)
    .where(eq(users.id, accountantId))
    .limit(1);
  return regionKey(u?.city);
}

type Exec = Pick<typeof db, "select">;

async function regionIntervals(exec: Exec, region: string, now: Date): Promise<BoostInterval[]> {
  const rows = (await exec
    .select({ startsAt: accountantBoosts.startsAt, expiresAt: accountantBoosts.expiresAt })
    .from(accountantBoosts)
    .where(and(eq(accountantBoosts.region, region), notOver(now)))) as {
    startsAt: Date | null;
    expiresAt: Date | null;
  }[];
  return rows
    .filter((r) => r.expiresAt)
    .map((r) => ({
      start: r.startsAt ? new Date(r.startsAt) : new Date(0),
      end: new Date(r.expiresAt as Date),
    }));
}

/** When a boost bought now in this region would start, and whether it's allowed. */
export async function getRegionAvailability(region: string, now = new Date()): Promise<RegionAvailability> {
  const intervals = await regionIntervals(db, region, now);
  const start = nextStart(intervals, now, MAX_BOOSTS_PER_REGION, BOOST_DURATION_MS);
  const waitMs = start.getTime() - now.getTime();
  return {
    region,
    startsAt: start.toISOString(),
    queued: waitMs > 0,
    full: waitMs > MAX_QUEUE_DAYS * 86_400_000,
    running: intervals.filter((i) => i.start.getTime() <= now.getTime()).length,
    cap: MAX_BOOSTS_PER_REGION,
  };
}

/**
 * Activates a boost from a VERIFIED Stripe webhook. Idempotent on the checkout
 * session id (unique index): a replayed webhook never creates a second boost.
 * Never called from the browser or success URL.
 *
 * Runs in a transaction holding a per-region advisory lock, so concurrent
 * payments in the same region are scheduled one after another and the region
 * can never exceed MAX_BOOSTS_PER_REGION. If the region is full the boost is
 * queued to the earliest free start; it always gets its full duration.
 */
export async function activateBoostFromWebhook(params: {
  accountantId: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  amount: number | null;
  currency: string | null;
  /** Region quoted at checkout. Falls back to the accountant's current city. */
  region?: string | null;
  now?: Date;
}): Promise<{ startsAt: Date; expiresAt: Date } | null> {
  const now = params.now ?? new Date();
  const region =
    params.region != null ? regionKey(params.region) : await accountantRegion(params.accountantId);

  return db.transaction(async (tx: typeof db) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`accountant_boost:${region}`}))`);

    const [existing] = await tx
      .select({
        id: accountantBoosts.id,
        status: accountantBoosts.status,
        startsAt: accountantBoosts.startsAt,
        expiresAt: accountantBoosts.expiresAt,
      })
      .from(accountantBoosts)
      .where(eq(accountantBoosts.stripeCheckoutSessionId, params.checkoutSessionId))
      .limit(1);

    // Already activated by a prior delivery of this event: no-op.
    if (existing?.status === "active") {
      return existing.startsAt && existing.expiresAt
        ? { startsAt: new Date(existing.startsAt), expiresAt: new Date(existing.expiresAt) }
        : null;
    }
    // A refund already cancelled this purchase: never resurrect it.
    if (existing?.status === "cancelled") return null;

    const intervals = await regionIntervals(tx, region, now);
    const startsAt = nextStart(intervals, now, MAX_BOOSTS_PER_REGION, BOOST_DURATION_MS);
    const expiresAt = new Date(startsAt.getTime() + BOOST_DURATION_MS);
    const values = {
      status: "active" as const,
      stripePaymentIntentId: params.paymentIntentId,
      amount: params.amount,
      currency: params.currency,
      startsAt,
      expiresAt,
      region,
    };

    if (existing) {
      await tx.update(accountantBoosts).set(values).where(eq(accountantBoosts.id, existing.id));
    } else {
      await tx.insert(accountantBoosts).values({
        ...values,
        accountantId: params.accountantId,
        stripeCheckoutSessionId: params.checkoutSessionId,
      });
    }
    return { startsAt, expiresAt };
  });
}

export interface RunningBoost {
  boostId: string;
  accountantId: string;
  region: string;
  impressions: number;
}

/** All boosts running right now (optionally only for these accountants). */
export async function getRunningBoosts(accountantIds?: string[], now = new Date()): Promise<RunningBoost[]> {
  if (accountantIds && accountantIds.length === 0) return [];
  const rows = (await db
    .select({
      boostId: accountantBoosts.id,
      accountantId: accountantBoosts.accountantId,
      region: accountantBoosts.region,
      impressions: accountantBoosts.impressions,
    })
    .from(accountantBoosts)
    .where(
      accountantIds
        ? and(runningNow(now), inArray(accountantBoosts.accountantId, accountantIds))
        : runningNow(now),
    )) as RunningBoost[];
  return rows.map((r) => ({ ...r, impressions: Number(r.impressions ?? 0) }));
}

/** Count one sponsored view for each boost shown. Atomic per row. */
export async function recordImpressions(boostIds: string[]): Promise<void> {
  if (!boostIds.length) return;
  await db
    .update(accountantBoosts)
    .set({ impressions: sql`${accountantBoosts.impressions} + 1` })
    .where(inArray(accountantBoosts.id, boostIds));
}
