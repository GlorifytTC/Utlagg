/**
 * Pure helpers for the inbound-email receipt webhook — no server deps, so they
 * stay unit-testable. See app/api/inbound/email/route.ts for the flow.
 */

/**
 * Extract the <token> from the first recipient shaped like
 * `kvitto+<token>@domain` (local-part with a plus-tag). Returns null when no
 * recipient carries a token. This is how a message is routed to a user, so it
 * only accepts alphanumeric tokens.
 */
export function recipientToken(addresses: Array<string | undefined>): string | null {
  for (const addr of addresses) {
    const m = /(?:^|\b)[^@\s+]+\+([a-zA-Z0-9]+)@/.exec(addr ?? "");
    if (m) return m[1];
  }
  return null;
}

/** Minimal HTML→text — only used when an email has no plaintext part. */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
