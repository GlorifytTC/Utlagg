/**
 * Pure logic for Accountant Boost capacity and fair rotation (no DB, no
 * server-only), so it is unit-testable. lib/accountant-boost.ts wires it to the
 * database.
 *
 * Model:
 *  - A boost belongs to a REGION: the accountant's normalized city at purchase
 *    ('' = no city, the nationwide pool).
 *  - At most `cap` boosts run at the same moment in one region. A paid boost
 *    that would exceed the cap is QUEUED: it starts at the earliest moment it
 *    fits and still runs its full duration. Nobody pays for time they don't get.
 *  - The marketplace shows a few SPONSORED slots; the running boosts with the
 *    fewest impressions fill them, so every payer gets an equal share of views.
 */

/** Same normalization as the SQL backfill in drizzle/0032_boost_regions.sql. */
export function regionKey(city: string | null | undefined): string {
  return (city ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

export interface BoostInterval {
  start: Date;
  end: Date;
}

/** How many intervals cover instant p (start inclusive, end exclusive). */
function coverage(intervals: BoostInterval[], p: number): number {
  let n = 0;
  for (const i of intervals) if (i.start.getTime() <= p && p < i.end.getTime()) n++;
  return n;
}

/**
 * Earliest start >= now at which a boost of `durationMs` never makes the
 * region exceed `cap` concurrent boosts. Concurrency only rises at a boost's
 * start, so it is enough to test the window's first instant plus every start
 * inside it; candidate start times are now and every existing end.
 */
export function nextStart(intervals: BoostInterval[], now: Date, cap: number, durationMs: number): Date {
  const live = intervals.filter((i) => i.end.getTime() > now.getTime());
  const candidates = [now.getTime(), ...live.map((i) => i.end.getTime())]
    .filter((t) => t >= now.getTime())
    .sort((a, b) => a - b);

  for (const t of candidates) {
    const windowEnd = t + durationMs;
    const points = [t, ...live.map((i) => i.start.getTime()).filter((s) => s > t && s < windowEnd)];
    if (points.every((p) => coverage(live, p) < cap)) return new Date(t);
  }
  // Unreachable: after the last end nothing is running.
  return new Date(candidates[candidates.length - 1]);
}

export interface SponsoredCandidate {
  boostId: string;
  accountantId: string;
  impressions: number;
}

/** FNV-1a -> [0,1). Deterministic tiebreak, no deps. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/**
 * Picks the sponsored slots: fewest impressions first. Equal counts are
 * ordered by a hash that changes every 10 minutes, so ties don't always favor
 * the same accountant. One slot per accountant.
 */
export function pickSponsored(candidates: SponsoredCandidate[], slots: number, now = new Date()): SponsoredCandidate[] {
  const bucket = Math.floor(now.getTime() / 600_000);
  const seen = new Set<string>();
  return [...candidates]
    .sort(
      (a, b) =>
        a.impressions - b.impressions ||
        hash01(`${a.boostId}:${bucket}`) - hash01(`${b.boostId}:${bucket}`) ||
        a.boostId.localeCompare(b.boostId),
    )
    .filter((c) => (seen.has(c.accountantId) ? false : (seen.add(c.accountantId), true)))
    .slice(0, slots);
}
