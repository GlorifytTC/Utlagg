import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { NextRequest } from "next/server";
import * as schema from "@/db/schema";

/**
 * Own model vs Gemini: real /api/ocr/shadow, real stats, real export route,
 * over PGlite with the actual migrations.
 */

const pg = new PGlite();
const testDb = drizzle(pg, { schema });
let sessionUser: { id: string; email: string } | null = null;
let adminSession: { user: { id: string; email: string } } | null = null;

vi.mock("@/db", () => ({ db: testDb }));
vi.mock("server-only", () => ({}));
vi.mock("next-auth", () => ({ getServerSession: async () => (sessionUser ? { user: sessionUser } : null) }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/admin", () => ({ requireAdmin: async () => adminSession }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logAuditEvent: vi.fn(), clientIp: () => null }));
vi.mock("@/lib/rate-limit", () => ({ checkLimit: async () => true, enforceRateLimit: async () => null }));

const { POST: shadow } = await import("@/app/api/ocr/shadow/route");
const { GET: exportDataset } = await import("@/app/api/admin/training/export/route");
const { getTrainingStats, computeReadiness, MIN_HEAD_TO_HEAD } = await import("@/lib/admin-training");

const post = (body: unknown) =>
  new NextRequest("http://test.local/api/ocr/shadow", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
async function q<T>(sql: string, p: unknown[] = []) {
  return (await pg.query<T>(sql, p)).rows;
}
async function user(email: string) {
  return (await q<{ id: string }>(`INSERT INTO users (email, scan_limit) VALUES ($1,25) RETURNING id`, [email]))[0].id;
}

const RIGHT = { vendorName: "ICA Maxi", date: "2026-10-01", totalAmount: 100, vatAmount: 12, vatRate: 12 };
const WRONG_TOTAL = { ...RIGHT, totalAmount: 10 };
const LABEL = { vendor: "ICA Maxi", date: "2026-10-01", total: "100.00", vat: "12.00", rate: 12 };

async function row(opts: { gemini?: object | null; own?: object | null; conf?: number | null; label?: typeof LABEL | null }) {
  const l = opts.label === undefined ? LABEL : opts.label;
  await pg.query(
    `INSERT INTO receipt_training_data (ai_result, local_result, local_confidence, source, image_data,
       confirmed_vendor, confirmed_date, confirmed_total, confirmed_vat, confirmed_vat_rate)
     VALUES ($1,$2,$3,$4,'data:img',$5,$6,$7,$8,$9)`,
    [
      opts.gemini === undefined ? JSON.stringify(RIGHT) : opts.gemini === null ? null : JSON.stringify(opts.gemini),
      opts.own == null ? null : JSON.stringify(opts.own),
      opts.conf ?? null,
      opts.gemini === null ? "local" : "gemini",
      l?.vendor ?? null, l?.date ?? null, l?.total ?? null, l?.vat ?? null, l?.rate ?? null,
    ],
  );
}

beforeAll(async () => {
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
});
beforeEach(async () => {
  await pg.exec(`TRUNCATE receipt_training_data, vendor_corrections, ocr_samples, users RESTART IDENTITY CASCADE;`);
  sessionUser = null;
  adminSession = null;
});

describe("POST /api/ocr/shadow", () => {
  const own = { vendorName: "ICA", totalAmount: 100, date: null, vatAmount: null, vatRate: 12 };

  it("requires login", async () => {
    expect((await shadow(post({ localResult: own }))).status).toBe(401);
  });

  it("attaches the own-model read to the caller's Gemini row", async () => {
    const u = await user("u@x.se");
    sessionUser = { id: u, email: "u@x.se" };
    const [{ id }] = await q<{ id: string }>(
      `INSERT INTO receipt_training_data (user_id, ai_result, source) VALUES ($1,'{}','gemini') RETURNING id`,
      [u],
    );
    const res = await shadow(post({ trainingId: id, localResult: own, localConfidence: 83.5 }));
    expect(res.status).toBe(200);
    const [r] = await q<{ local_result: { vendorName: string }; local_confidence: number }>(
      `SELECT local_result, local_confidence FROM receipt_training_data WHERE id=$1`,
      [id],
    );
    expect(r.local_result.vendorName).toBe("ICA");
    expect(r.local_confidence).toBeCloseTo(83.5);
  });

  it("cannot write onto another user's row", async () => {
    const owner = await user("owner@x.se");
    const attacker = await user("attacker@x.se");
    const [{ id }] = await q<{ id: string }>(
      `INSERT INTO receipt_training_data (user_id, ai_result, source) VALUES ($1,'{}','gemini') RETURNING id`,
      [owner],
    );
    sessionUser = { id: attacker, email: "attacker@x.se" };
    await shadow(post({ trainingId: id, localResult: own }));
    const [r] = await q<{ local_result: unknown }>(`SELECT local_result FROM receipt_training_data WHERE id=$1`, [id]);
    expect(r.local_result).toBeNull();
  });

  it("creates a 'local' training row when Gemini didn't read the receipt", async () => {
    const u = await user("u@x.se");
    sessionUser = { id: u, email: "u@x.se" };
    const res = await shadow(post({ image: "data:image/jpeg;base64,AAAA", localResult: own, localConfidence: 60 }));
    const d = await res.json();
    expect(d.trainingId).toBeTruthy();
    const [r] = await q<{ source: string; ai_result: unknown; user_id: string }>(
      `SELECT source, ai_result, user_id FROM receipt_training_data WHERE id=$1`,
      [d.trainingId],
    );
    expect(r).toMatchObject({ source: "local", ai_result: null, user_id: u });
  });

  it("rejects malformed input", async () => {
    sessionUser = { id: await user("u@x.se"), email: "u@x.se" };
    expect((await shadow(post({ localResult: { totalAmount: "lots" } }))).status).toBe(400);
    expect((await shadow(post({ localResult: own }))).status).toBe(400); // no trainingId and no image
  });
});

describe("getTrainingStats - own model vs Gemini", () => {
  it("scores both engines head-to-head on the same labeled receipts", async () => {
    await row({ own: RIGHT, conf: 92 }); //          both right, confident
    await row({ own: WRONG_TOTAL, conf: 55 }); //    own wrong, unsure
    await row({ gemini: WRONG_TOTAL, own: RIGHT, conf: 85 }); // Gemini wrong, own right
    await row({ own: null }); //                      Gemini only (no shadow yet)
    await row({ gemini: null, own: RIGHT, conf: 70 }); // own only
    await row({ own: RIGHT, conf: 95, label: null }); // unlabeled: ignored

    const s = await getTrainingStats();
    expect(s.headToHead.n).toBe(3);
    expect(s.headToHead.gemini.fullCorrect).toBe(2);
    expect(s.headToHead.own.fullCorrect).toBe(2);
    expect(s.engines.gemini.n).toBe(4); // all labeled rows Gemini read
    expect(s.engines.own.n).toBe(4); //    all labeled rows own model read
    expect(s.ownOnly).toBe(1); // only the row Gemini never read
    const total = Object.fromEntries(s.headToHead.own.fields.map((f) => [f.field, f]));
    expect(total.total).toEqual({ field: "total", checked: 3, correct: 2 });

    // Hybrid at 80: own handles the two confident ones (both right), Gemini the unsure one (right).
    const h80 = s.hybrid.find((h) => h.threshold === 80)!;
    expect(h80).toEqual({ threshold: 80, ownUsed: 2, ownCorrect: 2, blendedCorrect: 3 });
    // At 50 the own model takes all three and gets the unsure one wrong.
    expect(s.hybrid.find((h) => h.threshold === 50)).toEqual({ threshold: 50, ownUsed: 3, ownCorrect: 2, blendedCorrect: 2 });
    expect(s.readiness).toEqual({ state: "collecting", n: 3, needed: MIN_HEAD_TO_HEAD });
  });

  it("reports notMigrated when the own-model column is missing", async () => {
    await pg.exec(`ALTER TABLE receipt_training_data DROP COLUMN local_result;`);
    try {
      expect((await getTrainingStats()).notMigrated).toBe(true);
    } finally {
      await pg.exec(readFileSync("./drizzle/0030_own_model_shadow.sql", "utf8").replaceAll("--> statement-breakpoint", ""));
    }
  });
});

describe("computeReadiness", () => {
  const eng = (full: number) => ({ n: 0, fullCorrect: full, fields: [] });
  const h = (n: number, gem: number, own: number) => ({ n, gemini: eng(gem), own: eng(own) });
  const hy = (threshold: number, ownUsed: number, blendedCorrect: number) => ({ threshold, ownUsed, ownCorrect: 0, blendedCorrect });

  it("waits for enough data", () => {
    expect(computeReadiness(h(199, 190, 199), [])).toEqual({ state: "collecting", n: 199, needed: MIN_HEAD_TO_HEAD });
  });
  it("says replace when own model is within 1 point of Gemini", () => {
    expect(computeReadiness(h(1000, 950, 941), []).state).toBe("replace");
  });
  it("recommends the hybrid threshold that skips the most Gemini without losing accuracy", () => {
    const r = computeReadiness(h(1000, 950, 800), [hy(60, 700, 900), hy(80, 500, 945), hy(90, 300, 950)]);
    expect(r).toEqual({ state: "hybrid", threshold: 80, skipShare: 0.5, blendedAccuracy: 0.945 });
  });
  it("not ready when nothing keeps accuracy", () => {
    expect(computeReadiness(h(1000, 950, 600), [hy(90, 100, 900)]).state).toBe("not_ready");
  });
});

describe("GET /api/admin/training/export", () => {
  const read = async (res: Response) =>
    (await res.text()).trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));

  it("is admin-only", async () => {
    const res = await exportDataset(new NextRequest("http://test.local/x"));
    expect(res.status).toBe(403);
  });

  it("streams labeled rows only, no images by default, across batches", async () => {
    adminSession = { user: { id: await user("admin@k.se"), email: "admin@k.se" } };
    for (let i = 0; i < 150; i++) await row({ own: RIGHT, conf: 80 });
    await row({ own: RIGHT, label: null }); // unlabeled

    const lines = await read(await exportDataset(new NextRequest("http://test.local/x")));
    expect(lines).toHaveLength(150);
    expect(new Set(lines.map((l) => l.id)).size).toBe(150);
    expect(lines[0]).toMatchObject({ label: { vendorName: "ICA Maxi", totalAmount: 100, vatRate: 12 }, own: RIGHT });
    expect(lines[0]).not.toHaveProperty("image");

    const withImg = await read(await exportDataset(new NextRequest("http://test.local/x?images=1&all=1")));
    expect(withImg).toHaveLength(151);
    expect(withImg[0].image).toBe("data:img");
  });
});
