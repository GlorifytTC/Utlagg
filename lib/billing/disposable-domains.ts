/**
 * Disposable / throwaway email domains used by referral anti-abuse (spec §4).
 * BankID is disabled, so payment is the identity anchor — but rejecting obvious
 * throwaway inboxes at signup/attribution time is a cheap first filter against
 * referral rings minting free accounts.
 *
 * This is a deliberately small, high-signal starter list; extend it as abuse is
 * observed. The check is used to FLAG/deny referral attribution, not to block
 * signup outright (a real user on a niche provider shouldn't be locked out).
 */
export const DISPOSABLE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "sharklasers.com",
  "10minutemail.com",
  "temp-mail.org",
  "tempmail.com",
  "throwawaymail.com",
  "trashmail.com",
  "yopmail.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
  "mohmal.com",
  "emailondeck.com",
  "spamgourmet.com",
  "mytemp.email",
  "moakt.com",
  "tempinbox.com",
]);

export function isDisposableDomain(domain: string): boolean {
  return DISPOSABLE_EMAIL_DOMAINS.has(domain.toLowerCase());
}
