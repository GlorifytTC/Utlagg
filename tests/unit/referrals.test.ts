import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  isDisposableEmail,
  generateReferralCode,
} from "@/lib/billing/referral-utils";
import {
  applyReferralEvent,
  computeVestsAt,
  isVestable,
} from "@/lib/billing/referral-state";

describe("email normalisation (referral dedup)", () => {
  it("lower-cases and trims", () => {
    expect(normalizeEmail("  John@Example.COM ")).toBe("john@example.com");
  });

  it("strips +alias suffixes", () => {
    expect(normalizeEmail("jane+promo@example.com")).toBe("jane@example.com");
  });

  it("removes dots in Gmail local parts", () => {
    expect(normalizeEmail("John.Doe@gmail.com")).toBe("johndoe@gmail.com");
    expect(normalizeEmail("j.o.h.n+x@googlemail.com")).toBe("john@googlemail.com");
  });

  it("keeps dots for non-Gmail providers", () => {
    expect(normalizeEmail("john.doe@example.com")).toBe("john.doe@example.com");
  });

  it("collapses alias tricks to the same key", () => {
    expect(normalizeEmail("John.Doe+ref1@gmail.com")).toBe(
      normalizeEmail("johndoe+ref2@gmail.com"),
    );
  });
});

describe("disposable email detection", () => {
  it("flags known throwaway domains", () => {
    expect(isDisposableEmail("x@mailinator.com")).toBe(true);
    expect(isDisposableEmail("x@yopmail.com")).toBe(true);
  });
  it("passes normal domains", () => {
    expect(isDisposableEmail("x@gmail.com")).toBe(false);
    expect(isDisposableEmail("x@företaget.se")).toBe(false);
  });
});

describe("referral code generation", () => {
  it("is the configured length and uses an unambiguous alphabet", () => {
    const code = generateReferralCode(10);
    expect(code).toHaveLength(10);
    expect(code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]+$/);
  });
  it("is non-guessable (no two consecutive equal)", () => {
    const a = generateReferralCode();
    const b = generateReferralCode();
    expect(a).not.toBe(b);
  });
});

describe("referral reward state machine", () => {
  it("hold elapsed vests a pending reward", () => {
    expect(applyReferralEvent("pending", "hold_elapsed")).toMatchObject({
      next: "granted",
      clawback: false,
    });
  });

  it("refund / chargeback / cancel within hold voids a pending reward", () => {
    for (const e of ["refund", "chargeback", "cancel_within_hold"] as const) {
      expect(applyReferralEvent("pending", e)).toMatchObject({ next: "void" });
    }
  });

  it("does NOT reverse an already-granted reward on a later cancel", () => {
    const r = applyReferralEvent("granted", "cancel_within_hold");
    expect(r.noop).toBe(true);
    expect(r.next).toBe("granted");
  });

  it("fraud on a granted reward voids AND triggers clawback", () => {
    expect(applyReferralEvent("granted", "fraud")).toMatchObject({
      next: "void",
      clawback: true,
    });
  });

  it("fraud on a pending reward voids without clawback", () => {
    expect(applyReferralEvent("pending", "fraud")).toMatchObject({
      next: "void",
      clawback: false,
    });
  });

  it("void is terminal", () => {
    expect(applyReferralEvent("void", "hold_elapsed").noop).toBe(true);
    expect(applyReferralEvent("void", "fraud").noop).toBe(true);
  });

  it("computes vests-at from the hold window and gates vesting on it", () => {
    const pendingAt = new Date("2026-01-01T00:00:00Z");
    const vestsAt = computeVestsAt(pendingAt, 30);
    expect(vestsAt.toISOString()).toBe("2026-01-31T00:00:00.000Z");

    expect(isVestable({ status: "pending", vestsAt }, new Date("2026-01-30T00:00:00Z"))).toBe(false);
    expect(isVestable({ status: "pending", vestsAt }, new Date("2026-02-01T00:00:00Z"))).toBe(true);
    // Already-void reward never vests, even past the date.
    expect(isVestable({ status: "void", vestsAt }, new Date("2026-03-01T00:00:00Z"))).toBe(false);
  });
});
