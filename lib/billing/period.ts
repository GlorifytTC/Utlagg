/**
 * Billing-period resolution (Pricing V2 §2.3).
 *
 * The monthly scan counter resets aligned to the user's Stripe billing anchor
 * where one exists (so metering matches what they actually pay for), otherwise
 * to the calendar month in Europe/Stockholm (free users have no Stripe cycle).
 *
 * All calendar-month math is done in Swedish wall-clock time — never UTC — so a
 * reset at "the 1st, 00:00" means 00:00 in Stockholm, not 00:00 UTC (which is
 * 01:00/02:00 local and would reset an hour "early" for Swedish users).
 */
import { BILLING_TIMEZONE } from "@/lib/billing/config";

export interface BillingPeriod {
  start: Date;
  end: Date;
  /** How the period was derived — useful for logging/debugging. */
  source: "stripe" | "calendar";
}

/** Wall-clock offset (ms) of `tz` at the given instant: local - utc. */
function tzOffsetMs(instant: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(
    dtf.formatToParts(instant).map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  // `hour` can come back as "24" at midnight in some engines — normalise.
  const hour = p.hour === "24" ? 0 : Number(p.hour);
  const asLocal = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    hour,
    Number(p.minute),
    Number(p.second),
  );
  return asLocal - instant.getTime();
}

/** UTC instant of a given wall-clock time in `tz` (DST-aware, two-pass). */
function zonedTimeToUtc(
  y: number,
  m0: number,
  d: number,
  tz: string,
): Date {
  const guess = Date.UTC(y, m0, d, 0, 0, 0);
  // Apply the offset at the guess, then re-check at the corrected instant so a
  // DST transition between the two doesn't skew the result.
  const off1 = tzOffsetMs(new Date(guess), tz);
  const corrected = guess - off1;
  const off2 = tzOffsetMs(new Date(corrected), tz);
  return new Date(guess - off2);
}

/** The Stockholm calendar-month period containing `now`. */
export function calendarMonthPeriod(now: Date = new Date()): BillingPeriod {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: BILLING_TIMEZONE,
      year: "numeric",
      month: "2-digit",
    })
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  const y = Number(parts.year);
  const m0 = Number(parts.month) - 1;
  const start = zonedTimeToUtc(y, m0, 1, BILLING_TIMEZONE);
  const end = zonedTimeToUtc(m0 === 11 ? y + 1 : y, (m0 + 1) % 12, 1, BILLING_TIMEZONE);
  return { start, end, source: "calendar" };
}

/**
 * Resolve the billing period for a subscription. If Stripe has told us the
 * current period bounds, honour them; otherwise fall back to the Stockholm
 * calendar month. A partially-known Stripe period (start but no end, e.g. mid
 * plan-change) also falls back so we never invent a bogus window.
 */
export function resolveBillingPeriod(
  sub: { currentPeriodStart?: Date | null; currentPeriodEnd?: Date | null } | null,
  now: Date = new Date(),
): BillingPeriod {
  if (sub?.currentPeriodStart && sub?.currentPeriodEnd) {
    const start = new Date(sub.currentPeriodStart);
    const end = new Date(sub.currentPeriodEnd);
    // Only trust it if `now` actually sits inside the window; a stale row (e.g.
    // the cycle already rolled over but the webhook hasn't landed) shouldn't
    // pin us to an expired period.
    if (start.getTime() <= now.getTime() && now.getTime() < end.getTime()) {
      return { start, end, source: "stripe" };
    }
  }
  return calendarMonthPeriod(now);
}
