import { describe, it, expect } from "vitest";
import { rankAccountants, BOOST_WEIGHT } from "@/lib/marketplace-rank";

const mk = (id: string, relevance: number, firmId: string | null = null) => ({
  id, firmId, relevance, activeClientCount: 0, reviewCount: 0,
});
const hour = (n: number) => new Date(n * 3_600_000);
const ids = (r: { id: string }[]) => r.map((x) => x.id);

describe("marketplace ranking", () => {
  it("boost beats comparable organic, loses to clearly better", () => {
    expect(ids(rankAccountants([mk("plain", 3), mk("boosted", 0)], new Set(["boosted"]), hour(1)))[0]).toBe("boosted");
    expect(BOOST_WEIGHT).toBeGreaterThan(3);
    expect(ids(rankAccountants([mk("plain", 8), mk("boosted", 0)], new Set(["boosted"]), hour(1)))[0]).toBe("plain");
  });

  it("equal boosted firms rotate across hours, stable within an hour", () => {
    const b = new Set(["a", "b"]);
    const items = [mk("a", 2, "fa"), mk("b", 2, "fb")];
    const firsts = new Set<string>();
    for (let h = 0; h < 50; h++) {
      const o1 = ids(rankAccountants(items, b, hour(h)));
      expect(ids(rankAccountants([...items].reverse(), b, new Date(hour(h).getTime() + 59 * 60_000)))).toEqual(o1);
      firsts.add(o1[0]);
    }
    expect(firsts).toEqual(new Set(["a", "b"]));
  });

  it("same-firm members share jitter", () => {
    const b = new Set(["a1", "a2", "b"]);
    for (let h = 0; h < 20; h++) {
      const o = ids(rankAccountants([mk("a1", 2, "fa"), mk("a2", 2, "fa"), mk("b", 2, "fb")], b, hour(h)));
      expect(Math.abs(o.indexOf("a1") - o.indexOf("a2"))).toBe(1);
    }
  });
});
