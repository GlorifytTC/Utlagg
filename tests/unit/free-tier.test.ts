import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { NextRequest } from "next/server";
import * as schema from "@/db/schema";

/**
 * Free tier: manual receipts only. No scanning, OCR or image storage; manual
 * receipts are never metered (Free has a 500/month anti-abuse ceiling).
 * Read-only (expired trial / lapsed) behaves the same. Real createReceipt,
 * metering, cost guard and POST /api/receipts over PGlite.
 */

const pg = new PGlite();
const testDb = drizzle(pg, { schema });
let sessionUserId: string | null = null;

vi.mock("@/db", () => ({ db: testDb }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logAuditEvent: vi.fn(), clientIp: () => null }));
vi.mock("next-auth", () => ({
  getServerSession: async () => (sessionUserId ? { user: { id: sessionUserId } } : null),
}));

const { POST: createReceiptRoute } = await import("@/app/api/receipts/route");
const { guardCostlyCall } = await import("@/lib/cost-guard");
const { getUsageSnapshot, FREE_MANUAL_MONTHLY } = await import("@/lib/billing/metering");
const { isScannedReceipt } = await import("@/lib/receipts/create");

const IMG = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

async function q<T>(sql: string, p: unknown[] = []) {
  return (await pg.query<T>(sql, p)).rows;
}
async function user(email: string, tier = "free", status = "active", trialEndsAt: Date | null = null) {
  return (
    await q<{ id: string }>(
      `INSERT INTO users (email, scan_limit, subscription_tier, subscription_status, trial_ends_at)
       VALUES ($1, 25, $2, $3, $4) RETURNING id`,
      [email, tier, status, trialEndsAt],
    )
  )[0].id;
}
function post(body: unknown) {
  return createReceiptRoute(
    new NextRequest("http://x/api/receipts", { method: "POST", body: JSON.stringify(body) }),
  );
}
const manual = { vendorName: "ICA", totalAmount: 125, vatRate: 12 as const };

beforeAll(async () => {
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
  await pg.exec(`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES users(id)`);
});
beforeEach(async () => {
  await pg.exec(`TRUNCATE users, companies, scan_usage RESTART IDENTITY CASCADE;`);
  process.env.PRICING_V2_ENABLED = "true";
  process.env.PRICING_V3_ENABLED = "true";
  sessionUserId = null;
});

describe("isScannedReceipt", () => {
  it("image, OCR text or AI confidence make it a scan; typed fields don't", () => {
    expect(isScannedReceipt({})).toBe(false);
    expect(isScannedReceipt({ receiptText: "   " })).toBe(false);
    expect(isScannedReceipt({ imageUrl: IMG })).toBe(true);
    expect(isScannedReceipt({ receiptText: "ICA 125,00" })).toBe(true);
    expect(isScannedReceipt({ aiConfidence: 0 })).toBe(true);
  });
});

describe("Free plan", () => {
  it("adds a manual receipt", async () => {
    sessionUserId = await user("free@x.se");
    const res = await post(manual);
    expect(res.status).toBe(201);
    expect((await q(`SELECT 1 FROM receipts WHERE image_url IS NULL`)).length).toBe(1);
  });

  it("cannot save a picture or a scanned receipt (402 FREE_NO_SCAN), nothing stored", async () => {
    sessionUserId = await user("free@x.se");
    for (const body of [{ ...manual, imageUrl: IMG }, { ...manual, receiptText: "ICA\n125,00" }, { ...manual, aiConfidence: 0.9 }]) {
      const res = await post(body);
      expect(res.status).toBe(402);
      expect((await res.json()).code).toBe("FREE_NO_SCAN");
    }
    expect(await q(`SELECT 1 FROM receipts`)).toHaveLength(0);
  });

  it("is refused by the cost guard (OCR, AI vision, upload endpoints)", async () => {
    const id = await user("free@x.se");
    const res = await guardCostlyCall(id, "ocrai");
    expect(res?.status).toBe(402);
    expect((await getUsageSnapshot(id))?.reason).toBe("free_no_scan");
  });

  it("also applies when the pricing V2/V3 flags are off", async () => {
    process.env.PRICING_V2_ENABLED = "false";
    process.env.PRICING_V3_ENABLED = "false";
    sessionUserId = await user("legacy@x.se");
    expect((await post({ ...manual, imageUrl: IMG })).status).toBe(402);
    expect((await post(manual)).status).toBe(201);
  });

  it(`manual receipts are capped at ${FREE_MANUAL_MONTHLY} per month`, async () => {
    sessionUserId = await user("busy@x.se");
    await q(
      `INSERT INTO receipts (user_id, vendor_name) SELECT $1, 'x' FROM generate_series(1, $2)`,
      [sessionUserId, FREE_MANUAL_MONTHLY],
    );
    const res = await post(manual);
    expect(res.status).toBe(402);
    expect((await res.json()).code).toBe("MANUAL_LIMIT_REACHED");
    // Last month's receipts don't count.
    await q(`UPDATE receipts SET created_at = now() - interval '40 days'`);
    expect((await post(manual)).status).toBe(201);
  });

  it("a member of a company whose owner is on Free can't scan either", async () => {
    const owner = await user("owner@x.se");
    const member = await user("member@x.se", "pro");
    const [{ id: co }] = await q<{ id: string }>(`INSERT INTO companies (name) VALUES ('Co') RETURNING id`);
    await q(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'owner'),($1,$3,'member')`, [co, owner, member]);
    sessionUserId = member;
    expect((await post({ ...manual, imageUrl: IMG })).status).toBe(402);
    expect((await post(manual)).status).toBe(201);
  });
});

describe("Read-only (expired trial / lapsed) behaves like Free", () => {
  it("manual allowed, scan refused", async () => {
    sessionUserId = await user("lapsed@x.se", "pro", "read_only");
    expect((await post(manual)).status).toBe(201);
    const res = await post({ ...manual, imageUrl: IMG });
    expect(res.status).toBe(402);
    expect((await res.json()).code).toBe("FREE_NO_SCAN");
  });

  it("a trial whose end date passed is treated as read-only right away", async () => {
    sessionUserId = await user("old@x.se", "free", "trialing", new Date(Date.now() - 1000));
    expect((await post({ ...manual, imageUrl: IMG })).status).toBe(402);
    expect((await post(manual)).status).toBe(201);
  });
});

describe("Paid plans and trials", () => {
  it("trial can scan", async () => {
    sessionUserId = await user("trial@x.se", "free", "trialing", new Date(Date.now() + 10 * 86_400_000));
    expect((await post({ ...manual, imageUrl: IMG })).status).toBe(201);
  });

  it("paid plan scans are metered, manual receipts are not", async () => {
    sessionUserId = await user("pro@x.se", "pro");
    expect((await post({ ...manual, imageUrl: IMG })).status).toBe(201);
    expect((await post(manual)).status).toBe(201);
    expect((await post(manual)).status).toBe(201);
    const [u] = await q<{ n: number }>(`SELECT coalesce(sum(plan_scans_used),0)::int n FROM scan_usage`);
    expect(u.n).toBe(1);
  });

  it("paid plan is not refused by the cost guard", async () => {
    const id = await user("pro@x.se", "pro");
    expect(await guardCostlyCall(id, "ocrai")).toBeNull();
  });
});
