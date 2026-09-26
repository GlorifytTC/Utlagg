/**
 * Inbound-email receipt intake — the no-OCR digital channel.
 *
 * Users get a personal forwarding address (kvitto+<token>@<inbound domain>).
 * Emailed receipts and forwarded Kivra PDFs sent there arrive here via Brevo's
 * Inbound Parsing webhook. We read the machine text that's already in the email
 * body / PDF text layer and feed the EXISTING free parser (lib/ocr-parse.ts) —
 * no image, no vision tokens. The source document (PDF) and raw text are kept
 * for audit parity with scanned receipts.
 *
 * Brevo posts JSON: { items: [ { To, From, Subject, RawTextBody, RawHtmlBody,
 * ExtractedMarkdownMessage, Attachments: [ { Name, ContentType, DownloadToken }
 * ] } ] }. Attachment bytes are fetched from Brevo with the DownloadToken.
 */
import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { parseReceiptText } from "@/lib/ocr-parse";
import { extractPdfText } from "@/lib/pdf-text";
import { recipientToken, htmlToText } from "@/lib/inbound/parse";
import { createReceipt } from "@/lib/receipts/create";
import { uploadReceiptImage, isStorageConfigured } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const BREVO_ATTACHMENT_URL = "https://api.brevo.com/v3/inbound/attachments";

interface BrevoAddress {
  Name?: string;
  Address?: string;
}
interface BrevoAttachment {
  Name?: string;
  ContentType?: string;
  DownloadToken?: string;
}
interface BrevoItem {
  To?: BrevoAddress[];
  Cc?: BrevoAddress[];
  From?: BrevoAddress;
  Subject?: string;
  RawTextBody?: string;
  RawHtmlBody?: string;
  ExtractedMarkdownMessage?: string;
  Attachments?: BrevoAttachment[];
}

/** Constant-time compare so the webhook secret can't be brute-forced by timing. */
function secretOk(got: string | null): boolean {
  const want = process.env.INBOUND_WEBHOOK_SECRET;
  if (!want || !got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function downloadAttachment(token: string): Promise<Buffer | null> {
  const key = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY;
  if (!key) return null;
  const res = await fetch(`${BREVO_ATTACHMENT_URL}/${token}`, {
    headers: { "api-key": key, accept: "application/octet-stream" },
  });
  if (!res.ok) {
    console.error("brevo attachment download failed", res.status);
    return null;
  }
  return Buffer.from(await res.arrayBuffer());
}

async function handleItem(item: BrevoItem): Promise<void> {
  const recipients = [...(item.To ?? []), ...(item.Cc ?? [])].map((a) => a.Address);
  const token = recipientToken(recipients);
  if (!token) return;

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.inboundToken, token))
    .limit(1);
  // Unknown token: silently drop (don't reveal which addresses exist).
  if (!user) return;

  // Collect machine text: email body first, then any PDF attachment's text
  // layer. Store the first PDF as the receipt's source document.
  const parts: string[] = [];
  const bodyText =
    (item.RawTextBody && item.RawTextBody.trim()) ||
    (item.ExtractedMarkdownMessage && item.ExtractedMarkdownMessage.trim()) ||
    (item.RawHtmlBody ? htmlToText(item.RawHtmlBody) : "");
  if (bodyText) parts.push(bodyText);

  let imageUrl: string | undefined;
  for (const att of item.Attachments ?? []) {
    const isPdf =
      att.ContentType?.includes("pdf") || /\.pdf$/i.test(att.Name ?? "");
    if (!isPdf || !att.DownloadToken) continue;
    const bytes = await downloadAttachment(att.DownloadToken);
    if (!bytes) continue;
    try {
      const text = await extractPdfText(bytes);
      if (text) parts.push(text);
    } catch (e) {
      console.error("pdf text extraction failed", e);
    }
    // Persist the original PDF once (best-effort; text still yields a receipt).
    if (!imageUrl && isStorageConfigured()) {
      try {
        const dataUrl = `data:application/pdf;base64,${bytes.toString("base64")}`;
        const { key } = await uploadReceiptImage(user.id, crypto.randomUUID(), dataUrl);
        imageUrl = key;
      } catch (e) {
        console.error("pdf store failed", e);
      }
    }
  }

  const combined = parts.join("\n\n").trim();
  if (!combined) return; // nothing parseable (e.g. image-only email) — drop.

  const extracted = parseReceiptText(combined);
  const result = await createReceipt(user.id, {
    imageUrl,
    vendorName: extracted.vendorName,
    receiptNumber: extracted.receiptNumber ?? undefined,
    date: extracted.date,
    totalAmount: extracted.totalAmount,
    vatAmount: extracted.vatAmount,
    vatRate: extracted.vatRate,
    aiConfidence: extracted.confidence,
    receiptText: combined.slice(0, 20000),
  });
  if (!result.ok) {
    // Quota reached — nothing to retry, so don't 500 (Brevo would resend).
    console.warn("inbound receipt blocked by quota for user", user.id, result.meter.reason);
  }
}

export async function POST(req: NextRequest) {
  if (!secretOk(req.nextUrl.searchParams.get("secret"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let payload: { items?: BrevoItem[] };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  // Process each message; never let one bad item fail the whole batch, and
  // always 200 so Brevo doesn't retry a message we've already consumed.
  for (const item of payload.items ?? []) {
    try {
      await handleItem(item);
    } catch (e) {
      console.error("inbound item failed", e);
    }
  }

  return NextResponse.json({ ok: true });
}
