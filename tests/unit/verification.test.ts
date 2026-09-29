import { describe, it, expect } from "vitest";
import { validateCredentialDoc, MAX_CREDENTIAL_BYTES } from "@/lib/verification";

const dataUrl = (type: string, bytes: Buffer) => `data:${type};base64,${bytes.toString("base64")}`;
const pdf = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(100)]);
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100)]);
const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(100)]);
const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBPVP8 "), Buffer.alloc(100)]);

describe("validateCredentialDoc", () => {
  it("accepts real PDF, PNG, JPEG and WebP", () => {
    expect(validateCredentialDoc(dataUrl("application/pdf", pdf)).ok).toBe(true);
    expect(validateCredentialDoc(dataUrl("image/png", png)).ok).toBe(true);
    expect(validateCredentialDoc(dataUrl("image/jpeg", jpeg)).ok).toBe(true);
    expect(validateCredentialDoc(dataUrl("image/webp", webp)).ok).toBe(true);
  });

  it("rejects content that does not match the declared type", () => {
    expect(validateCredentialDoc(dataUrl("application/pdf", Buffer.from("<html><script>alert(1)</script>"))).ok).toBe(false);
    expect(validateCredentialDoc(dataUrl("image/png", pdf)).ok).toBe(false);
    expect(validateCredentialDoc(dataUrl("image/jpeg", png)).ok).toBe(false);
  });

  it("rejects disallowed types and non-data-URL input", () => {
    expect(validateCredentialDoc(dataUrl("image/svg+xml", Buffer.from("<svg/>"))).ok).toBe(false);
    expect(validateCredentialDoc(dataUrl("image/heic", jpeg)).ok).toBe(false);
    expect(validateCredentialDoc(dataUrl("text/html", pdf)).ok).toBe(false);
    expect(validateCredentialDoc(pdf.toString("base64")).ok).toBe(false);
    expect(validateCredentialDoc(null).ok).toBe(false);
    expect(validateCredentialDoc(dataUrl("application/pdf", pdf) + "\n<x>").ok).toBe(false);
  });

  it("enforces the size cap", () => {
    const max = Buffer.concat([pdf, Buffer.alloc(MAX_CREDENTIAL_BYTES - pdf.length)]);
    expect(validateCredentialDoc(dataUrl("application/pdf", max)).ok).toBe(true);
    const over = Buffer.concat([max, Buffer.alloc(4)]);
    expect(validateCredentialDoc(dataUrl("application/pdf", over)).ok).toBe(false);
  });
});
