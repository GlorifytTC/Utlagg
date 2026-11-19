import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { NextRequest } from "next/server";
import * as schema from "@/db/schema";
import { nextStart, pickSponsored, regionKey, type BoostInterval } from "@/lib/boost-schedule";

/**
 * Boost capacity: at most 10 running per region, the rest queued with a full
 * 7 days, 3 fair sponsored slots in the marketplace. Pure scheduler tests plus
 * the REAL activateBoostFromWebhook and route handlers over PGlite with the
 * real migrations.
 */

const pg = new PGlite();
const testDb = drizzle(pg, { schema });
let sessionUserId: string | null = null;
const checkoutCreate = vi.fn(async () => ({ url: "https://checkout.stripe.test/x" }));

vi.mock("@/db", () => ({ db: testDb }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next-auth", () => ({
  getServerSession: async () => (sessionUserId ? { user: { id: sessionUserId } } : null),
}));
vi.mock("@/lib/stripe", () => ({
  stripe: { checkout: { sessions: { create: checkoutCreate } }, customers: { create: async () => ({ id: "cus_t" }) } },
}));

const boost = await import("@/lib/accountant-boost");
const { POST: buyBoost, GET: boostStatus } = await import("@/app/api/accountant/boost/route");
const { GET: marketplace } = await import("@/app/api/marketplace/accountants/route");

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const T0 = new Date("2026-11-19T10:00:00Z");

async function q<T>(sql: string, p: unknown[] = []) {
  return (await pg.query<T>(sql, p)).rows;
}
async function accountant(email: string, city: string | null) {
  return (
    await q<{ id: string }>(
      `INSERT INTO users (email, name, is_accountant, scan_limit, accountant_city) VALUES ($1,$1,true,25,$2) RETURNING id`,
      [email, city],
    )
  )[0].id;
}
async function customer(email: string, city: string | null) {
  const id = (await q<{ id: string }>(`INSERT INTO users (email, scan_limit) VALUES ($1,25) RETURNING id`, [email]))[0].id;
  const co = (await q<{ id: string }>(`INSERT INTO companies (name, city) VALUES ('Co',$1) RETURNING id`, [city]))[0].id;
  await q(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'owner')`, [co, id]);
  return id;
}
function pay(accountantId: string, session: string, now = T0, region?: string | null) {
  return boost.activateBoostFromWebhook({
    accountantId,
    checkoutSessionId: session,
    paymentIntentId: `pi_${session}`,
    amount: boost.BOOST_PRICE_ORE,
    currency: "sek",
    region,
    now,
  });
}
/** Max boosts running at once in a region, checked at every start instant. */
async function peakConcurrency(region: string) {
  const rows = await q<{ s: Date; e: Date }>(
    `SELECT starts_at s, expires_at e FROM accountant_boosts WHERE region=$1 AND status='active'`,
    [region],
  );
  let peak = 0;
  for (const r of rows) {
    const p = new Date(r.s).getTime();
    peak = Math.max(peak, rows.filter((x) => new Date(x.s).getTime() <= p && p < new Date(x.e).getTime()).length);
  }
  return peak;
}

beforeAll(async () => {
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
  await pg.exec(`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES users(id)`);
});
beforeEach(async () => {
  await pg.exec(`TRUNCATE accountant_boosts, users, companies RESTART IDENTITY CASCADE;`);
  sessionUserId = null;
  checkoutCreate.mockClear();
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
});

describe("regionKey", () => {
  it("normalizes case and whitespace; no city is the nationwide pool", () => {
    expect(regionKey("  Stockholm ")).toBe("stockholm");
    expect(regionKey("Upplands   Väsby")).toBe("upplands väsby");
    expect(regionKey(null)).toBe("");
  });
});

describe("nextStart (pure scheduler)", () => {
  const iv = (startDays: number, endDays: number): BoostInterval => ({
    start: new Date(T0.getTime() + startDays * DAY),
    end: new Date(T0.getTime() + endDays * DAY),
  });

  it("starts now when below the cap", () => {
    expect(nextStart([iv(0, 7), iv(-2, 5)], T0, 10, WEEK).getTime()).toBe(T0.getTime());
  });

  it("queues to the earliest end when the region is full", () => {
    const full = Array.from({ length: 10 }, (_, i) => iv(-3, 4 + i * 0.1));
    expect(nextStart(full, T0, 10, WEEK).getTime()).toBe(T0.getTime() + 4 * DAY);
  });

  it("will not start now if a queued boost would overlap past the cap later", () => {
    // 9 running until day 7, 1 queued from day 2, 1 ending day 1. Now: 10 (full).
    // Day 1 frees a place, but at day 2 it would be 9 + queued + new = 11, so
    // the earliest valid start is day 7 when the 9 end.
    const ivs = [...Array.from({ length: 9 }, () => iv(0, 7)), iv(2, 9), iv(-1, 1)];
    const t = nextStart(ivs, T0, 10, WEEK);
    expect(t.getTime()).toBe(T0.getTime() + 7 * DAY);
    const placed = [...ivs, { start: t, end: new Date(t.getTime() + WEEK) }];
    for (let d = 0; d < 21; d += 0.25) {
      const p = T0.getTime() + d * DAY;
      expect(placed.filter((i) => i.start.getTime() <= p && p < i.end.getTime()).length).toBeLessThanOrEqual(10);
    }
  });
});

describe("pickSponsored (fair rotation)", () => {
  it("equal share of views over many rounds, one slot per accountant", () => {
    const c = Array.from({ length: 10 }, (_, i) => ({ boostId: `b${i}`, accountantId: `a${i}`, impressions: 0 }));
    let now = T0.getTime();
    for (let round = 0; round < 300; round++) {
      const picked = pickSponsored(c, 3, new Date(now));
      expect(picked).toHaveLength(3);
      expect(new Set(picked.map((p) => p.accountantId)).size).toBe(3);
      for (const p of picked) p.impressions++;
      now += 60_000;
    }
    const counts = c.map((x) => x.impressions);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });
});

describe("activateBoostFromWebhook (real, Postgres)", () => {
  it("25 payments in one city: never more than 10 running, the rest queued with a full 7 days", async () => {
    const ids = await Promise.all(Array.from({ length: 25 }, (_, i) => accountant(`a${i}@firm.se`, "Göteborg")));
    for (let i = 0; i < ids.length; i++) await pay(ids[i], `cs_${i}`);

    expect(await peakConcurrency("göteborg")).toBe(10);
    const rows = await q<{ s: Date; e: Date }>(`SELECT starts_at s, expires_at e FROM accountant_boosts`);
    expect(rows).toHaveLength(25);
    for (const r of rows) expect(new Date(r.e).getTime() - new Date(r.s).getTime()).toBe(WEEK);
    const runningNow = rows.filter((r) => new Date(r.s).getTime() <= T0.getTime());
    expect(runningNow).toHaveLength(10);
  });

  it("concurrent webhook deliveries still respect the cap", async () => {
    const ids = await Promise.all(Array.from({ length: 15 }, (_, i) => accountant(`c${i}@firm.se`, "Malmö")));
    await Promise.all(ids.map((id, i) => pay(id, `cc_${i}`)));
    expect(await peakConcurrency("malmö")).toBeLessThanOrEqual(10);
  });

  it("regions are independent", async () => {
    for (let i = 0; i < 10; i++) await pay(await accountant(`s${i}@f.se`, "Stockholm"), `s_${i}`);
    const lund = await accountant("lund@f.se", "Lund");
    const r = await pay(lund, "lund_1");
    expect(r?.startsAt.getTime()).toBe(T0.getTime());
  });

  it("replayed webhook is a no-op; a refunded (cancelled) boost is never resurrected", async () => {
    const a = await accountant("r@f.se", "Umeå");
    const first = await pay(a, "cs_r");
    const again = await pay(a, "cs_r", new Date(T0.getTime() + DAY));
    expect(again?.startsAt.getTime()).toBe(first?.startsAt.getTime());
    expect(await q(`SELECT 1 FROM accountant_boosts`)).toHaveLength(1);

    await q(`UPDATE accountant_boosts SET status='cancelled'`);
    expect(await pay(a, "cs_r")).toBeNull();
    expect((await q<{ status: string }>(`SELECT status FROM accountant_boosts`))[0].status).toBe("cancelled");
  });

  it("queued boost reports scheduled, not active", async () => {
    for (let i = 0; i < 10; i++) await pay(await accountant(`f${i}@f.se`, "Kiruna"), `f_${i}`);
    const late = await accountant("late@f.se", "Kiruna");
    await pay(late, "late_1");
    const s = await boost.getBoostState(late, T0);
    expect(s.active).toBe(false);
    expect(s.scheduled).toBe(true);
    const later = await boost.getBoostState(late, new Date(T0.getTime() + WEEK + 1000));
    expect(later.active).toBe(true);
  });
});

describe("POST /api/accountant/boost (real route)", () => {
  it("refuses with 409 full when the queue is longer than 14 days", async () => {
    // 30 boosts in one region: queue reaches ~3 weeks.
    const now = new Date();
    for (let i = 0; i < 30; i++) await pay(await accountant(`q${i}@f.se`, "Visby"), `q_${i}`, now);
    sessionUserId = await accountant("buyer@f.se", "Visby");
    const res = await buyBoost(new NextRequest("http://x/api/accountant/boost", { method: "POST" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.full).toBe(true);
    expect(body.nextAvailableAt).toBeTruthy();
    expect(checkoutCreate).not.toHaveBeenCalled();
  });

  it("GET shows the region availability (queued when full now)", async () => {
    const now = new Date();
    for (let i = 0; i < 10; i++) await pay(await accountant(`g${i}@f.se`, "Luleå"), `g_${i}`, now);
    sessionUserId = await accountant("viewer@f.se", "Luleå");
    const body = await (await boostStatus()).json();
    expect(body.availability.queued).toBe(true);
    expect(body.availability.full).toBe(false);
  });

  it("a queued buyer cannot buy a second boost", async () => {
    const now = new Date();
    for (let i = 0; i < 10; i++) await pay(await accountant(`h${i}@f.se`, "Sundsvall"), `h_${i}`, now);
    const me = await accountant("me@f.se", "Sundsvall");
    await pay(me, "me_1", now);
    sessionUserId = me;
    const res = await buyBoost(new NextRequest("http://x/api/accountant/boost", { method: "POST" }));
    expect(res.status).toBe(409);
    expect((await res.json()).alreadyActive).toBe(true);
  });
});

describe("GET /api/marketplace/accountants sponsored slots (real route)", () => {
  it("at most 3 sponsored, from the viewer's region, impressions counted; accountant viewers don't count", async () => {
    const now = new Date();
    for (let i = 0; i < 8; i++) await pay(await accountant(`m${i}@f.se`, "Örebro"), `m_${i}`, now);
    await pay(await accountant("other@f.se", "Västerås"), "other_1", now);

    sessionUserId = await customer("kund@co.se", "Örebro");
    const body = await (await marketplace(new NextRequest("http://x/api/marketplace/accountants"))).json();
    expect(body.sponsored.length).toBe(3);
    for (const s of body.sponsored) expect(s.city).toBe("Örebro");
    const total = await q<{ n: number }>(`SELECT sum(impressions)::int n FROM accountant_boosts`);
    expect(total[0].n).toBe(3);

    // Next view rotates to boosts that haven't been shown yet.
    const body2 = await (await marketplace(new NextRequest("http://x/api/marketplace/accountants"))).json();
    const first = new Set(body.sponsored.map((s: { id: string }) => s.id));
    for (const s of body2.sponsored) expect(first.has(s.id)).toBe(false);

    sessionUserId = await accountant("peer@f.se", "Örebro");
    await marketplace(new NextRequest("http://x/api/marketplace/accountants"));
    expect((await q<{ n: number }>(`SELECT sum(impressions)::int n FROM accountant_boosts`))[0].n).toBe(6);
  });

  it("queued boosts are never shown as sponsored", async () => {
    const now = new Date();
    const ids: string[] = [];
    for (let i = 0; i < 12; i++) {
      const id = await accountant(`k${i}@f.se`, "Falun");
      ids.push(id);
      await pay(id, `k_${i}`, now);
    }
    sessionUserId = await customer("k@co.se", "Falun");
    for (let r = 0; r < 6; r++) {
      const body = await (await marketplace(new NextRequest("http://x/api/marketplace/accountants"))).json();
      for (const s of body.sponsored) expect([ids[10], ids[11]]).not.toContain(s.id);
    }
  });
});
