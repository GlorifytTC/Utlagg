import { Client, Receiver } from "@upstash/qstash";

/**
 * Upstash QStash — offload long-running OCR off the request path so serverless
 * timeouts don't truncate it. Optional: if QSTASH_TOKEN is unset, callers
 * should fall back to synchronous OCR (/api/ocr still works).
 */
export function isQueueConfigured(): boolean {
  return Boolean(process.env.QSTASH_TOKEN);
}

let _client: Client | null = null;
export function qstash(): Client {
  if (!process.env.QSTASH_TOKEN) {
    throw new Error("QSTASH_TOKEN is not set");
  }
  _client ??= new Client({ token: process.env.QSTASH_TOKEN });
  return _client;
}

/** Verifies an incoming QStash callback signature (use in the callback route). */
export function qstashReceiver(): Receiver {
  return new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY ?? "",
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY ?? "",
  });
}
