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
const MAGIC: Record<string, (b: Buffer) => boolean> = {
  "application/pdf": (b) => b.subarray(0, 5).toString("latin1") === "%PDF-",
  "image/png": (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
  "image/jpeg": (b) => b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  "image/webp": (b) =>
    b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
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
  if (!MAGIC[m[1]](Buffer.from(m[2].slice(0, 16), "base64"))) {
    return { ok: false, error: "Filens innehåll matchar inte filtypen." };
  }
  return { ok: true };
}
