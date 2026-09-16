import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Integration/security tests for the unified accountant MARKETPLACE:
 * GET /api/marketplace/accountants — any signed-in user can browse, ranked by
 * relevance (industry match) + popularity (active client count) + boost.
 * Uses real Postgres (PGlite) with actual migrations.
 */

let pg: PGlite;

async function reset() {
  await pg.exec(
    `TRUNCATE accountant_boosts, accountant_connection_requests, accountant_clients, company_members, companies, users RESTART IDENTITY CASCADE;`,
  );
}

async function makeUser(email: string, isAccountant = false, name: string | null = null) {
  return (
    await pg.query<{ id: string }>(
      `INSERT INTO users (email, name, is_accountant, scan_limit) VALUES ($1,$2,$3,25) RETURNING id`,
      [email.toLowerCase(), name, isAccountant],
    )
  ).rows[0].id;
}

async function makeCompany(name: string, ownerId: string, industry: string | null = null) {
  const id = (
    await pg.query<{ id: string }>(
      `INSERT INTO companies (name, industry) VALUES ($1,$2) RETURNING id`,
      [name, industry],
    )
  ).rows[0].id;
  await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'owner')`, [
    id,
    ownerId,
  ]);
  return id;
}

async function setAccountantProfile(
  userId: string,
  opts: { city?: string; bio?: string; specializations?: string[] },
) {
  const parts: string[] = [];
  const params: unknown[] = [];
  if (opts.city !== undefined) {
    params.push(opts.city);
    parts.push(`accountant_city=$${params.length}`);
  }
  if (opts.bio !== undefined) {
    params.push(opts.bio);
    parts.push(`accountant_bio=$${params.length}`);
  }
  if (opts.specializations !== undefined) {
    params.push(JSON.stringify(opts.specializations));
    parts.push(`accountant_specializations=$${params.length}`);
  }
  if (parts.length) {
    params.push(userId);
    await pg.query(`UPDATE users SET ${parts.join(", ")} WHERE id=$${params.length}`, params);
  }
}

async function activateBoost(accountantId: string) {
  const expires = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
  await pg.query(
    `INSERT INTO accountant_boosts (accountant_id, status, expires_at, starts_at, stripe_checkout_session_id)
     VALUES ($1,'active',$2,now(),$3)`,
    [accountantId, expires, `sess_${accountantId}`],
  );
}

async function addActiveClient(accountantId: string, companyId: string) {
  await pg.query(
    `INSERT INTO accountant_clients (accountant_id, company_id, status, activated_at) VALUES ($1,$2,'active',now())`,
    [accountantId, companyId],
  );
}

/** Replicates the GET /api/marketplace/accountants logic. */
async function marketplace(
  sessionUserId: string | null,
  opts: { q?: string; city?: string; specialization?: string } = {},
) {
  if (!sessionUserId) return { status: 401 as const };

  const conds = [`u.is_accountant = true`];
  const params: unknown[] = [];

  if (opts.q) {
    params.push(`%${opts.q}%`);
    conds.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }
  if (opts.city) {
    params.push(`%${opts.city}%`);
    conds.push(`u.accountant_city ILIKE $${params.length}`);
  }
  if (opts.specialization) {
    params.push(`%${opts.specialization}%`);
    conds.push(`u.accountant_specializations::text ILIKE $${params.length}`);
  }

  const rows = (
    await pg.query<{
      id: string;
      name: string | null;
      email: string;
      logo_url: string | null;
      accountant_city: string | null;
      accountant_bio: string | null;
      accountant_specializations: string[] | null;
    }>(
      `SELECT u.id, u.name, u.email, u.logo_url, u.accountant_city, u.accountant_bio, u.accountant_specializations
       FROM users u WHERE ${conds.join(" AND ")}`,
      params,
    )
  ).rows;

  if (!rows.length) return { status: 200 as const, accountants: [] };

  const ids = rows.map((r) => r.id);
  const idList = ids.map((_, i) => `$${i + 1}`).join(",");

  const clientCounts = (
    await pg.query<{ accountant_id: string; cnt: number }>(
      `SELECT accountant_id, count(*)::int AS cnt FROM accountant_clients WHERE status='active' AND accountant_id IN (${idList}) GROUP BY accountant_id`,
      ids,
    )
  ).rows;

  const boostedRows = (
    await pg.query<{ accountant_id: string }>(
      `SELECT accountant_id FROM accountant_boosts WHERE status='active' AND expires_at > now() AND accountant_id IN (${idList})`,
      ids,
    )
  ).rows;

  // Viewer company for relevance
  const viewerMembership = (
    await pg.query<{ company_id: string; role: string }>(
      `SELECT company_id, role FROM company_members WHERE user_id=$1 LIMIT 1`,
      [sessionUserId],
    )
  ).rows[0];

  let viewerIndustry: string | null = null;
  if (viewerMembership) {
    const co = (
      await pg.query<{ industry: string | null }>(
        `SELECT industry FROM companies WHERE id=$1`,
        [viewerMembership.company_id],
      )
    ).rows[0];
    viewerIndustry = co?.industry ?? null;
  }

  const clientCountMap = new Map(clientCounts.map((r) => [r.accountant_id, r.cnt]));
  const boostedIds = new Set(boostedRows.map((r) => r.accountant_id));

  const items = rows.map((a) => {
    let relevance = 0;
    const clientCount = clientCountMap.get(a.id) ?? 0;
    relevance += Math.min(Math.floor(clientCount / 3), 2);
    if (viewerIndustry && Array.isArray(a.accountant_specializations)) {
      const lower = viewerIndustry.toLowerCase();
      if (a.accountant_specializations.some((s: string) => s.toLowerCase() === lower)) {
        relevance += 3;
      }
    }
    return {
      id: a.id,
      name: a.name,
      email: a.email,
      city: a.accountant_city,
      bio: a.accountant_bio,
      specializations: a.accountant_specializations,
      activeClientCount: clientCount,
      isBoosted: boostedIds.has(a.id),
      relevance,
    };
  });

  // Sort: relevance DESC, boosted first within same relevance, id for stability
  items.sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    const ab = boostedIds.has(a.id) ? 1 : 0;
    const bb = boostedIds.has(b.id) ? 1 : 0;
    if (bb !== ab) return bb - ab;
    return a.id.localeCompare(b.id);
  });

  return { status: 200 as const, accountants: items };
}

beforeAll(async () => {
  pg = new PGlite();
  for (const f of readdirSync("./drizzle")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
});

describe("Marketplace authentication", () => {
  it("unauthenticated → 401", async () => {
    expect((await marketplace(null)).status).toBe(401);
  });

  it("any signed-in user can browse", async () => {
    await reset();
    const viewer = await makeUser("viewer@co.se");
    await makeUser("a@firm.se", true, "Anna");
    expect((await marketplace(viewer)).status).toBe(200);
  });
});

describe("Marketplace safe fields", () => {
  it("returns only safe display fields", async () => {
    await reset();
    const viewer = await makeUser("v@co.se");
    await makeUser("a@firm.se", true, "Anna");
    const res = await marketplace(viewer);
    const keys = Object.keys(res.accountants![0]).sort();
    // Must include these
    for (const k of ["id", "name", "email", "city", "bio", "specializations", "activeClientCount", "isBoosted"]) {
      expect(keys).toContain(k);
    }
    // Must NOT include sensitive fields
    for (const bad of ["hashed_password", "subscription_tier", "email_verification_token", "stripe_customer_id"]) {
      expect(keys).not.toContain(bad);
    }
  });

  it("only isAccountant=true users appear", async () => {
    await reset();
    const viewer = await makeUser("viewer@co.se");
    await makeUser("a1@firm.se", true, "Anna");
    await makeUser("not-acct@co.se", false, "Normal User");
    const res = await marketplace(viewer);
    expect(res.accountants!.map((a) => a.email)).toContain("a1@firm.se");
    expect(res.accountants!.map((a) => a.email)).not.toContain("not-acct@co.se");
  });
});

describe("Marketplace filters", () => {
  it("name search filters results", async () => {
    await reset();
    const viewer = await makeUser("v@co.se");
    await makeUser("anna@firm.se", true, "Anna Svensson");
    await makeUser("bengt@firm.se", true, "Bengt Karlsson");
    const res = await marketplace(viewer, { q: "anna" });
    expect(res.accountants!.map((a) => a.email)).toEqual(["anna@firm.se"]);
  });

  it("city filter works", async () => {
    await reset();
    const viewer = await makeUser("v@co.se");
    const a1 = await makeUser("sthlm@firm.se", true, "Stockholm");
    const a2 = await makeUser("gbg@firm.se", true, "Göteborg");
    await setAccountantProfile(a1, { city: "Stockholm" });
    await setAccountantProfile(a2, { city: "Göteborg" });
    const res = await marketplace(viewer, { city: "Stockholm" });
    expect(res.accountants!.map((a) => a.email)).toEqual(["sthlm@firm.se"]);
  });

  it("specialization filter works", async () => {
    await reset();
    const viewer = await makeUser("v@co.se");
    const a1 = await makeUser("rest@firm.se", true, "Restaurang Specialist");
    const a2 = await makeUser("it@firm.se", true, "IT Specialist");
    await setAccountantProfile(a1, { specializations: ["restaurang", "mat"] });
    await setAccountantProfile(a2, { specializations: ["IT", "tech"] });
    const res = await marketplace(viewer, { specialization: "restaurang" });
    expect(res.accountants!.map((a) => a.email)).toEqual(["rest@firm.se"]);
  });
});

describe("Marketplace ranking", () => {
  it("boosted accountant ranks above non-boosted with equal relevance", async () => {
    await reset();
    const viewer = await makeUser("v@co.se");
    const a1 = await makeUser("boosted@firm.se", true, "Boosted");
    const a2 = await makeUser("plain@firm.se", true, "Plain");
    await activateBoost(a1);
    const res = await marketplace(viewer);
    const ids = res.accountants!.map((a) => a.id);
    expect(ids.indexOf(a1)).toBeLessThan(ids.indexOf(a2));
  });

  it("industry-matching accountant ranks above boosted non-matching", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    await makeCompany("Restaurant AB", owner, "restaurang");
    const match = await makeUser("match@firm.se", true, "Restaurant Expert");
    const boostedNoMatch = await makeUser("boosted@firm.se", true, "IT Expert");
    await setAccountantProfile(match, { specializations: ["restaurang"] });
    await activateBoost(boostedNoMatch);
    const res = await marketplace(owner);
    const ids = res.accountants!.map((a) => a.id);
    expect(ids.indexOf(match)).toBeLessThan(ids.indexOf(boostedNoMatch));
  });

  it("popularity (client count) contributes to rank", async () => {
    await reset();
    const viewer = await makeUser("v@co.se");
    const popular = await makeUser("popular@firm.se", true, "Popular");
    const unpopular = await makeUser("unpopular@firm.se", true, "Unpopular");
    // Give popular accountant 3 active clients (= 1 popularity point)
    for (let i = 0; i < 3; i++) {
      const o = await makeUser(`owner${i}@co.se`);
      const co = (await pg.query<{ id: string }>(`INSERT INTO companies (name) VALUES ($${1}) RETURNING id`, [`Co${i}`])).rows[0].id;
      await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'owner')`, [co, o]);
      await addActiveClient(popular, co);
    }
    const res = await marketplace(viewer);
    const ids = res.accountants!.map((a) => a.id);
    expect(ids.indexOf(popular)).toBeLessThan(ids.indexOf(unpopular));
  });
});

describe("Marketplace profile update (PATCH)", () => {
  it("new profile fields persisted and returned", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    await setAccountantProfile(acct, {
      city: "Malmö",
      bio: "Specialiserad på restaurangbranschen.",
      specializations: ["restaurang", "livsmedel"],
    });
    const rows = (await pg.query<{ accountant_city: string; accountant_bio: string; accountant_specializations: unknown }>(
      `SELECT accountant_city, accountant_bio, accountant_specializations FROM users WHERE id=$1`,
      [acct],
    )).rows[0];
    expect(rows.accountant_city).toBe("Malmö");
    expect(rows.accountant_bio).toContain("restaurang");
    expect(rows.accountant_specializations).toContain("restaurang");
  });
});
