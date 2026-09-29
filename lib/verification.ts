/**
 * Accountant credential verification: validation of the uploaded scan.
 * Kept free of "server-only" so the client can share the limits and the
 * validator can be unit-tested.
 */

/** Decoded file cap. 3 MB as base64 stays under Vercel's 4.5 MB body limit. */
export const MAX_CREDENTIAL_BYTES = 3 * 1024 * 1024;

export const CREDENTIAL_ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";

// First bytes each allowed type must start with. The data-URL prefix is
// client-controlled, so the bytes must match what it claims.
// Matched against the hex of the first decoded bytes.
const MAGIC: Record<string, RegExp> = {
  "application/pdf": /^255044462d/, // %PDF-
  "image/png": /^89504e47/,
  "image/jpeg": /^ffd8ff/,
  "image/webp": /^52494646.{8}57454250/, // RIFF....WEBP
};

/** Validates a credential scan sent as a base64 data URL (PDF, PNG, JPEG or WebP, max 3 MB). */
export function validateCredentialDoc(v: unknown): { ok: boolean; error?: string } {
  if (typeof v !== "string") return { ok: false, error: "Ogiltig fil." };
  // Length check first so the regex never runs on a huge string.
  if (v.length > 64 + Math.ceil(MAX_CREDENTIAL_BYTES / 3) * 4) {
    return { ok: false, error: "Filen är för stor (max 3 MB)." };
  }
  const m = /^data:(application\/pdf|image\/png|image\/jpeg|image\/webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(v);
  if (!m) return { ok: false, error: "Filen måste vara PDF, PNG, JPEG eller WebP." };
  const bytes = Math.floor((m[2].length * 3) / 4) - (m[2].match(/=*$/)?.[0].length ?? 0);
  if (bytes > MAX_CREDENTIAL_BYTES) return { ok: false, error: "Filen är för stor (max 3 MB)." };
  if (!MAGIC[m[1]].test(Buffer.from(m[2].slice(0, 16), "base64").toString("hex"))) {
    return { ok: false, error: "Filens innehåll matchar inte filtypen." };
  }
  return { ok: true };
}
