/**
 * Marketplace ranking: organic relevance + paid-boost bonus, with hourly
 * rotation among boosted accountants/firms (like ad-auction rotation).
 * Pure (no DB) so it is unit-testable; lib/accountant-boost.ts is server-only.
 */

/** > industry match (3), < max organic relevance (8): lifts comparable results, never a clearly better one. */
export const BOOST_WEIGHT = 4;

export interface Rankable {
  id: string;
  firmId: string | null;
  relevance: number;
  activeClientCount: number;
  reviewCount: number;
}

/** FNV-1a -> [0,1). Deterministic, no deps. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/**
 * score = relevance + (boosted ? BOOST_WEIGHT + jitter : 0). jitter in [0,1) is
 * a hash of (firm or accountant, hour bucket): boosted rivals of similar
 * relevance take turns on top each hour, same-firm members move together, and
 * order is stable within the hour so pagination stays consistent.
 */
export function rankAccountants<T extends Rankable>(items: T[], boostedIds: Set<string>, now = new Date()): T[] {
  const bucket = Math.floor(now.getTime() / 3_600_000);
  const score = (a: T) =>
    a.relevance + (boostedIds.has(a.id) ? BOOST_WEIGHT + hash01(`${a.firmId ?? a.id}:${bucket}`) : 0);
  return items
    .map((a) => ({ a, s: score(a) }))
    .sort(
      (x, y) =>
        y.s - x.s ||
        y.a.activeClientCount - x.a.activeClientCount ||
        y.a.reviewCount - x.a.reviewCount ||
        x.a.id.localeCompare(y.a.id),
    )
    .map((x) => x.a);
}
