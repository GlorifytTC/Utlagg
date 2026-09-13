import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Tests for Accountant Boost: activation idempotency, expiry correctness (query
 * time, not cron), ranking (relevance first / boost second), and the webhook
 * validation logic. DB-backed via PGlite with the real migrations.
 *
 * The constants + rankAccountants are mirrored here (the real module is
 * server-only and can't be imported into the vitest env); the ranking logic is
 * identical to lib/accountant-boost.ts.
 */

const BOOST_PRICE_ORE = 4900;
const BOOST_CURRENCY = "sek";
const BOOST_DURATION_DAYS = 7;

function rankAccountants<T extends { accountantId: string; relevance: number }>(items: T[], boostedIds: Set<string>): T[] {
  return [...items].sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    const ab = boostedIds.has(a.accountantId) ? 1 : 0;
    const bb = boostedIds.has(b.accountantId) ? 1 : 0;
    if (bb !== ab) return bb - ab;
    return a.accountantId.localeCompare(b.accountantId);
  });
}

let pg: PGlite;

async function reset() {
  await pg.exec(`TRUNCATE accountant_boosts, users RESTART IDENTITY CASCADE;`);
}
async function makeUser(email: string, isAccountant = true) {
  return (await pg.query<{ id: string }>(`INSERT INTO users (email, is_accountant, scan_limit) VALUES ($1,$2,25) RETURNING id`, [email, isAccountant])).rows[0].id;
}

/** Replicates activateBoostFromWebhook: idempotent on session id. */
async function activate(accountantId: string, sessionId: string, days = BOOST_DURATION_DAYS) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 86_400_000);
  const existing = (await pg.query<{ id: string; status: string }>(`SELECT id, status FROM accountant_boosts WHERE stripe_checkout_session_id=$1`, [sessionId])).rows[0];
  if (existing) {
    if (existing.status === "active") return;
    await pg.query(`UPDATE accountant_boosts SET status='active', starts_at=$1, expires_at=$2 WHERE id=$3`, [now, expiresAt, existing.id]);
    return;
  }
  await pg.query(
    `INSERT INTO accountant_boosts (accountant_id, status, stripe_checkout_session_id, amount, currency, starts_at, expires_at) VALUES ($1,'active',$2,$3,$4,$5,$6)`,
    [accountantId, sessionId, BOOST_PRICE_ORE, BOOST_CURRENCY, now, expiresAt],
  );
}
/** Replicates getBoostState: active iff status='active' AND expires_at > now(). */
async function isActive(accountantId: string) {
  return (await pg.query(`SELECT 1 FROM accountant_boosts WHERE accountant_id=$1 AND status='active' AND expires_at > now()`, [accountantId])).rows.length > 0;
}

/** Replicates the webhook validation gate. */
function webhookAccepts(meta: { kind?: string; accountantId?: string }, paymentStatus: string, amountTotal: number, currency: string) {
  return (
    meta.kind === "accountant_boost" &&
    !!meta.accountantId &&
    paymentStatus === "paid" &&
    amountTotal === BOOST_PRICE_ORE &&
    currency.toLowerCase() === "sek"
  );
}

beforeAll(async () => {
  pg = new PGlite();
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort())
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
});

describe("Boost — product definition", () => {
  it("is 49 kr / 7 days / SEK", () => {
    expect(BOOST_PRICE_ORE).toBe(4900);
    expect(BOOST_CURRENCY).toBe("sek");
    expect(BOOST_DURATION_DAYS).toBe(7);
  });
});

describe("Boost — activation & idempotency", () => {
  it("a verified webhook activates the boost", async () => {
    await reset();
    const a = await makeUser("a@firm.se");
    await activate(a, "cs_1");
    expect(await isActive(a)).toBe(true);
  });

  it("duplicate webhook (same session) does NOT create a second boost", async () => {
    await reset();
    const a = await makeUser("a@firm.se");
    await activate(a, "cs_1");
    await activate(a, "cs_1"); // replay
    await activate(a, "cs_1"); // replay
    expect((await pg.query(`SELECT 1 FROM accountant_boosts WHERE accountant_id=$1`, [a])).rows).toHaveLength(1);
    expect(await isActive(a)).toBe(true);
  });

  it("the unique session index enforces one row per session at the DB level", async () => {
    await reset();
    const a = await makeUser("a@firm.se");
    await activate(a, "cs_dup");
    await expect(
      pg.query(`INSERT INTO accountant_boosts (accountant_id, status, stripe_checkout_session_id) VALUES ($1,'active','cs_dup')`, [a]),
    ).rejects.toThrow();
  });
});

describe("Boost — expiry (query-time, not cron)", () => {
  it("an expired boost is NOT active even if status stayed 'active'", async () => {
    await reset();
    const a = await makeUser("a@firm.se");
    // insert an 'active' row that already expired (no cron ran)
    await pg.query(
      `INSERT INTO accountant_boosts (accountant_id, status, stripe_checkout_session_id, starts_at, expires_at) VALUES ($1,'active','cs_old', now() - interval '8 days', now() - interval '1 day')`,
      [a],
    );
    expect(await isActive(a)).toBe(false); // expires_at > now() fails → not active
  });

  it("a boost expiring in the future is active", async () => {
    await reset();
    const a = await makeUser("a@firm.se");
    await activate(a, "cs_future", 7);
    expect(await isActive(a)).toBe(true);
  });
});

describe("Boost — webhook validation", () => {
  it("accepts a correct paid boost session", () => {
    expect(webhookAccepts({ kind: "accountant_boost", accountantId: "a1" }, "paid", 4900, "sek")).toBe(true);
  });
  it("rejects wrong amount", () => {
    expect(webhookAccepts({ kind: "accountant_boost", accountantId: "a1" }, "paid", 1, "sek")).toBe(false);
  });
  it("rejects wrong currency", () => {
    expect(webhookAccepts({ kind: "accountant_boost", accountantId: "a1" }, "paid", 4900, "usd")).toBe(false);
  });
  it("rejects unpaid session", () => {
    expect(webhookAccepts({ kind: "accountant_boost", accountantId: "a1" }, "unpaid", 4900, "sek")).toBe(false);
  });
  it("rejects missing accountantId / wrong kind", () => {
    expect(webhookAccepts({ kind: "accountant_boost" }, "paid", 4900, "sek")).toBe(false);
    expect(webhookAccepts({ kind: "credit_pack", accountantId: "a1" }, "paid", 4900, "sek")).toBe(false);
  });
});

describe("Boost — ranking (relevance first, boost second)", () => {
  it("boosted accountant ranks above an EQUALLY relevant non-boosted one", () => {
    const items = [
      { accountantId: "plain", relevance: 5 },
      { accountantId: "boosted", relevance: 5 },
    ];
    const ranked = rankAccountants(items, new Set(["boosted"]));
    expect(ranked[0].accountantId).toBe("boosted");
  });

  it("Boost does NOT override materially higher relevance", () => {
    const items = [
      { accountantId: "relevant", relevance: 9 }, // not boosted, very relevant
      { accountantId: "boosted", relevance: 3 }, // boosted, weak relevance
    ];
    const ranked = rankAccountants(items, new Set(["boosted"]));
    expect(ranked[0].accountantId).toBe("relevant");
  });

  it("non-boosted results remain present; ranking is deterministic", () => {
    const items = [
      { accountantId: "b", relevance: 5 },
      { accountantId: "a", relevance: 5 },
      { accountantId: "c", relevance: 5 },
    ];
    const r1 = rankAccountants(items, new Set()).map((x) => x.accountantId);
    const r2 = rankAccountants(items, new Set()).map((x) => x.accountantId);
    expect(r1).toEqual(r2); // deterministic
    expect(r1).toEqual(["a", "b", "c"]); // stable id tie-break
  });
});
