/**
 * Pure referral helpers (no I/O) — email normalisation, disposable-domain
 * detection and referral-code generation. Kept side-effect-free so the dedup
 * rules can be unit-tested (see tests/unit/referrals.test.ts).
 */
import { randomBytes } from "node:crypto";
import { REFERRAL_CODE_LENGTH } from "@/lib/billing/config";
import { isDisposableDomain } from "@/lib/billing/disposable-domains";

/** Providers that treat local-part dots as insignificant. */
const DOT_INSENSITIVE = new Set([
  "gmail.com",
  "googlemail.com",
]);

/**
 * Normalise an email for referral DEDUP (not for storage/login):
 *  - lower-case, trimmed
 *  - drop everything from the first `+` in the local part (plus-aliasing)
 *  - for Gmail, remove dots in the local part (they're insignificant there)
 *
 * So `John.Doe+promo@gmail.com` and `johndoe@gmail.com` collapse to the same
 * key, defeating the cheapest way to "refer yourself" many times.
 */
export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at === -1) return trimmed;
  let local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);

  const plus = local.indexOf("+");
  if (plus !== -1) local = local.slice(0, plus);
  if (DOT_INSENSITIVE.has(domain)) local = local.replace(/\./g, "");

  return `${local}@${domain}`;
}

export function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1).toLowerCase();
}

export function isDisposableEmail(email: string): boolean {
  return isDisposableDomain(emailDomain(email));
}

/**
 * Non-guessable referral code. Base32 (Crockford-ish, no ambiguous 0/1/O/I) so
 * it's short, URL-safe and readable when shared verbally.
 */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateReferralCode(length = REFERRAL_CODE_LENGTH): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
