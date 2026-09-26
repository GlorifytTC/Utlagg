import { describe, it, expect } from "vitest";
import { PERMANENT_BAN, banEndFor, isBanned } from "../../lib/moderation";

describe("moderation", () => {
  const now = new Date("2026-09-26T12:00:00Z");

  it("treats only future dates as banned", () => {
    expect(isBanned(null, now)).toBe(false);
    expect(isBanned(undefined, now)).toBe(false);
    expect(isBanned(new Date("2026-09-26T11:59:59Z"), now)).toBe(false);
    expect(isBanned(new Date("2026-09-26T12:00:01Z"), now)).toBe(true);
  });

  it("computes ban end dates", () => {
    expect(banEndFor("ban7", now).toISOString()).toBe("2026-10-03T12:00:00.000Z");
    expect(banEndFor("banPermanent", now)).toBe(PERMANENT_BAN);
    expect(isBanned(banEndFor("banPermanent", now), now)).toBe(true);
  });
});
