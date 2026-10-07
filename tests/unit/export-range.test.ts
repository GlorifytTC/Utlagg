import { describe, expect, it } from "vitest";
import { computeRange, parseRange, toIso } from "@/lib/export-range";

describe("export-range", () => {
  it("toIso uses local calendar date", () => {
    expect(toIso(new Date(2026, 0, 1))).toBe("2026-01-01");
  });
  it("quarters", () => {
    const now = new Date(2026, 10, 15);
    expect(computeRange("thisQuarter", now)).toEqual({ from: "2026-10-01", to: "2026-12-31" });
    expect(computeRange("lastQuarter", now)).toEqual({ from: "2026-07-01", to: "2026-09-30" });
  });
  it("last quarter wraps year", () => {
    expect(computeRange("lastQuarter", new Date(2026, 1, 3))).toEqual({ from: "2025-10-01", to: "2025-12-31" });
  });
  it("last month wraps year", () => {
    expect(computeRange("lastMonth", new Date(2026, 0, 10))).toEqual({ from: "2025-12-01", to: "2025-12-31" });
  });
  it("parseRange ignores invalid, end-of-day to", () => {
    const r = parseRange(new URLSearchParams("from=nope&to=2026-03-31"));
    expect(r.from).toBeNull();
    expect(r.to!.getHours()).toBe(23);
  });
});
