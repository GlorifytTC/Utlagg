import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM for sensitive values at rest (e.g. personnummer, third-party
 * tokens). ENCRYPTION_SECRET must be 32 bytes as 64 hex chars
 * (openssl rand -hex 32). Format: iv:authTag:ciphertext (all hex).
 *
 * Never log decrypted output.
 */
const ALGO = "aes-256-gcm";

function key(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length !== 64) {
    throw new Error(
      "ENCRYPTION_SECRET must be 64 hex chars (32 bytes). Generate: openssl rand -hex 32",
    );
  }
  return Buffer.from(secret, "hex");
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12); // 96-bit nonce recommended for GCM
  const cipher = createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decrypt(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Invalid ciphertext format");
  }
  const decipher = createDecipheriv(ALGO, key(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

export function isEncryptionConfigured(): boolean {
  return (process.env.ENCRYPTION_SECRET?.length ?? 0) === 64;
}
