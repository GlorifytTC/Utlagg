import { describe, it, expect } from "vitest";
import { calendarMonthPeriod, resolveBillingPeriod } from "@/lib/billing/period";

describe("calendar-month period (Europe/Stockholm)", () => {
  it("brackets the month in Swedish wall-clock time", () => {
    // 2026-06-15 12:00Z is mid-June in Stockholm.
    const p = calendarMonthPeriod(new Date("2026-06-15T12:00:00Z"));
    // Stockholm is UTC+2 in June (CEST) → local midnight is 22:00Z the prior day.
    expect(p.start.toISOString()).toBe("2026-05-31T22:00:00.000Z");
    expect(p.end.toISOString()).toBe("2026-06-30T22:00:00.000Z");
    expect(p.source).toBe("calendar");
  });

  it("rolls the year over in December", () => {
    const p = calendarMonthPeriod(new Date("2026-12-10T12:00:00Z"));
    // December → January boundary; Stockholm is UTC+1 in winter (CET).
    expect(p.start.toISOString()).toBe("2026-11-30T23:00:00.000Z");
    expect(p.end.toISOString()).toBe("2026-12-31T23:00:00.000Z");
  });
});

describe("resolveBillingPeriod — Stripe anchor vs calendar fallback", () => {
  const now = new Date("2026-06-15T12:00:00Z");

  it("uses the Stripe period when `now` is inside it", () => {
    const p = resolveBillingPeriod(
      {
        currentPeriodStart: new Date("2026-06-03T09:00:00Z"),
        currentPeriodEnd: new Date("2026-07-03T09:00:00Z"),
      },
      now,
    );
    expect(p.source).toBe("stripe");
    expect(p.start.toISOString()).toBe("2026-06-03T09:00:00.000Z");
  });

  it("falls back to the calendar month with no subscription", () => {
    expect(resolveBillingPeriod(null, now).source).toBe("calendar");
  });

  it("falls back when the Stripe window is stale (now past its end)", () => {
    const p = resolveBillingPeriod(
      {
        currentPeriodStart: new Date("2026-04-01T00:00:00Z"),
        currentPeriodEnd: new Date("2026-05-01T00:00:00Z"),
      },
      now,
    );
    expect(p.source).toBe("calendar");
  });
});
