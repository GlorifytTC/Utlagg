export type ModerationAction = "warn" | "ban7" | "banPermanent";

export const PERMANENT_BAN = new Date("2099-12-31T23:59:59Z");

export function isBanned(until: Date | null | undefined, now = new Date()): boolean {
  return !!until && until > now;
}

export function banEndFor(action: "ban7" | "banPermanent", now = new Date()): Date {
  return action === "ban7" ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : PERMANENT_BAN;
}
