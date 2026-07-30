/**
 * Pure referral reward state machine (no I/O), so the vesting/void transitions
 * can be unit-tested exhaustively (see tests/unit/referrals.test.ts).
 *
 *   (none) --first_paid--> pending
 *   pending --hold_elapsed(+good standing)--> granted
 *   pending --refund|chargeback|cancel_within_hold--> void
 *   pending|granted --fraud--> void   (granted → void triggers clawback)
 *
 * `granted` is terminal except for a fraud clawback. `void` is terminal.
 */
export type ReferralState = "pending" | "vested" | "granted" | "void";

export type ReferralEvent =
  | "first_paid"
  | "hold_elapsed"
  | "refund"
  | "chargeback"
  | "cancel_within_hold"
  | "fraud";

export interface TransitionResult {
  next: ReferralState;
  /** True when moving out of `granted` — the caller must reverse the grant. */
  clawback: boolean;
  /** No-op transition (event doesn't apply in this state). */
  noop: boolean;
}

export function applyReferralEvent(
  current: ReferralState,
  event: ReferralEvent,
): TransitionResult {
  const stay = (): TransitionResult => ({ next: current, clawback: false, noop: true });

  switch (event) {
    case "hold_elapsed":
      return current === "pending"
        ? { next: "granted", clawback: false, noop: false }
        : stay();

    case "refund":
    case "chargeback":
    case "cancel_within_hold":
      // Only voids while still within the hold (i.e. still pending). A cancel
      // AFTER the reward has vested/granted doesn't reverse it.
      return current === "pending"
        ? { next: "void", clawback: false, noop: false }
        : stay();

    case "fraud":
      if (current === "pending") return { next: "void", clawback: false, noop: false };
      if (current === "granted") return { next: "void", clawback: true, noop: false };
      return stay();

    default:
      return stay();
  }
}

export function computeVestsAt(pendingAt: Date, holdDays: number): Date {
  return new Date(pendingAt.getTime() + holdDays * 24 * 60 * 60 * 1000);
}

export function isVestable(
  reward: { status: ReferralState; vestsAt: Date | null },
  now: Date = new Date(),
): boolean {
  return (
    reward.status === "pending" &&
    reward.vestsAt != null &&
    reward.vestsAt.getTime() <= now.getTime()
  );
}
