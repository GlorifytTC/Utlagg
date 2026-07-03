import { sql } from "drizzle-orm";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { db } from "@/db";
import { stripe } from "@/lib/stripe";
import { isStorageConfigured } from "@/lib/storage";
import { isEmailConfigured } from "@/lib/email";

export interface HealthStatus {
  name: string;
  status: "up" | "down" | "unconfigured";
  latencyMs?: number;
  detail?: string;
}

async function timed(name: string, fn: () => Promise<void>): Promise<HealthStatus> {
  const start = Date.now();
  try {
    await fn();
    return { name, status: "up", latencyMs: Date.now() - start };
  } catch (err) {
    return { name, status: "down", detail: err instanceof Error ? err.message : "error" };
  }
}

export function checkDatabase(): Promise<HealthStatus> {
  return timed("Databas", async () => {
    await (db as { execute: (q: unknown) => Promise<unknown> }).execute(sql`select 1`);
  });
}

export async function checkRedis(): Promise<HealthStatus> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { name: "Redis (Upstash)", status: "unconfigured" };
  }
  const { Redis } = await import("@upstash/redis");
  return timed("Redis (Upstash)", async () => {
    await Redis.fromEnv().ping();
  });
}

export async function checkStripe(): Promise<HealthStatus> {
  if (!process.env.STRIPE_SECRET_KEY) return { name: "Stripe", status: "unconfigured" };
  return timed("Stripe", async () => {
    await stripe.balance.retrieve();
  });
}

export async function checkR2(): Promise<HealthStatus> {
  if (!isStorageConfigured()) return { name: "R2-lagring", status: "unconfigured" };
  return timed("R2-lagring", async () => {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    await client.send(new HeadBucketCommand({ Bucket: process.env.R2_BUCKET_NAME! }));
  });
}

/** Config-only checks (no cheap health endpoint available). */
function configured(name: string, ok: boolean): HealthStatus {
  return { name, status: ok ? "up" : "unconfigured" };
}

/**
 * Real Gemini probe: doesn't just check the env var exists — it makes the
 * cheapest possible API call (listing models) to verify the KEY IS VALID.
 * A wrong-console key (e.g. a Vertex/Cloud key instead of an AI Studio
 * "AIza..." key) exists as an env var but fails this call, which is
 * exactly the failure mode worth surfacing on the health page.
 */
export async function checkGemini(): Promise<HealthStatus> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { name: "AI-läsning (Gemini)", status: "unconfigured" };
  return timed("AI-läsning (Gemini)", async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=1`,
        { signal: controller.signal },
      );
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Gemini svarade ${res.status}${res.status === 400 || res.status === 403 ? " — nyckeln avvisades (kontrollera att den är aktiv i AI Studio och inte begränsad bort från Gemini API)" : ` — ${body.slice(0, 120)}`}`,
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  });
}

export async function checkAll(): Promise<HealthStatus[]> {
  const [dbh, redis, stripeh, r2, gemini] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkStripe(),
    checkR2(),
    checkGemini(),
  ]);
  return [
    dbh,
    redis,
    stripeh,
    r2,
    gemini,
    configured("E-post (Brevo)", isEmailConfigured()),
    configured("OCR (Google Vision)", Boolean(process.env.GOOGLE_CLOUD_API_KEY)),
    configured("Kö (QStash)", Boolean(process.env.QSTASH_TOKEN)),
  ];
}