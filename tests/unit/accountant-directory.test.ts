import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Integration/security tests for the accountant DIRECTORY + company→accountant
 * REQUEST flow, against real Postgres (PGlite) with the actual migrations.
 * The request lifecycle reuses the existing connection-request logic; these
 * tests cover the directory query (eligibility + field safety + search) and
 * that requesting via the chosen id behaves correctly.
 */

let pg: PGlite;

async function reset() {
  await pg.exec(`TRUNCATE accountant_connection_requests, accountant_clients, company_members, companies, users RESTART IDENTITY CASCADE;`);
}
async function makeUser(email: string, isAccountant = false, name: string | null = null) {
  return (await pg.query<{ id: string }>(
    `INSERT INTO users (email, name, is_accountant, scan_limit) VALUES ($1,$2,$3,25) RETURNING id`,
    [email.toLowerCase(), name, isAccountant],
  )).rows[0].id;
}
async function makeCompany(name: string, ownerId: string) {
  const id = (await pg.query<{ id: string }>(`INSERT INTO companies (name) VALUES ($1) RETURNING id`, [name])).rows[0].id;
  await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'owner')`, [id, ownerId]);
  return id;
}
async function addMember(companyId: string, userId: string, role: string) {
  await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,$3)`, [companyId, userId, role]);
}
async function getUserCompany(userId: string) {
  const [m] = (await pg.query<{ company_id: string; role: string }>(`SELECT company_id, role FROM company_members WHERE user_id=$1 LIMIT 1`, [userId])).rows;
  return m ? { companyId: m.company_id, role: m.role } : null;
}
const canManage = (r: string) => r === "owner" || r === "admin";

/** Replicates GET /api/accountants/directory — safe fields only, search, bounded. */
async function directory(sessionUserId: string | null, q = "", pageSize = 20) {
  if (!sessionUserId) return { status: 401 as const };
  const like = `%${q}%`;
  const rows = (await pg.query<{ id: string; name: string | null; email: string }>(
    q
      ? `SELECT id, name, email FROM users WHERE is_accountant=true AND (name ILIKE $1 OR email ILIKE $1) ORDER BY name, email LIMIT ${pageSize}`
      : `SELECT id, name, email FROM users WHERE is_accountant=true ORDER BY name, email LIMIT ${pageSize}`,
    q ? [like] : [],
  )).rows;
  return { status: 200 as const, accountants: rows };
}

/** Replicates POST /api/accountant/connection-requests { accountantId }. */
async function requestConnection(sessionUserId: string, accountantId: string) {
  const membership = await getUserCompany(sessionUserId);
  if (!membership) return { status: 409 as const, needsCompany: true };
  if (!canManage(membership.role)) return { status: 403 as const };
  const companyId = membership.companyId;
  const target = (await pg.query<{ is_accountant: boolean }>(`SELECT is_accountant FROM users WHERE id=$1`, [accountantId])).rows[0];
  if (!target || !target.is_accountant) return { status: 404 as const };
  const active = (await pg.query(`SELECT 1 FROM accountant_clients WHERE accountant_id=$1 AND company_id=$2 AND status='active'`, [accountantId, companyId])).rows;
  if (active.length) return { status: 409 as const, alreadyConnected: true };
  const existing = (await pg.query<{ id: string; status: string }>(`SELECT id, status FROM accountant_connection_requests WHERE company_id=$1 AND accountant_id=$2`, [companyId, accountantId])).rows[0];
  if (existing) {
    if (existing.status === "pending") return { status: 200 as const, alreadyPending: true };
    await pg.query(`UPDATE accountant_connection_requests SET status='pending', requested_by=$1, responded_at=NULL WHERE id=$2`, [sessionUserId, existing.id]);
  } else {
    await pg.query(`INSERT INTO accountant_connection_requests (company_id, accountant_id, requested_by, status) VALUES ($1,$2,$3,'pending')`, [companyId, accountantId, sessionUserId]);
  }
  return { status: 200 as const, companyId };
}
async function hasAccess(accountantId: string, companyId: string) {
  return (await pg.query(`SELECT 1 FROM accountant_clients WHERE accountant_id=$1 AND company_id=$2 AND status='active'`, [accountantId, companyId])).rows.length > 0;
}

beforeAll(async () => {
  pg = new PGlite();
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
});

describe("Accountant directory", () => {
  it("authenticated user can list accountants; only isAccountant=true appear", async () => {
    await reset();
    const viewer = await makeUser("viewer@co.se");
    await makeUser("a1@firm.se", true, "Anna");
    await makeUser("a2@firm.se", true, "Bengt");
    await makeUser("normal@co.se", false, "Normal");
    const res = await directory(viewer);
    expect(res.status).toBe(200);
    expect(res.accountants!.map((a) => a.email).sort()).toEqual(["a1@firm.se", "a2@firm.se"]);
    expect(res.accountants!.some((a) => a.email === "normal@co.se")).toBe(false);
  });

  it("unauthenticated → 401", async () => {
    await reset();
    expect((await directory(null)).status).toBe(401);
  });

  it("returns ONLY id/name/email (no sensitive fields)", async () => {
    await reset();
    const viewer = await makeUser("v@co.se");
    await makeUser("a@firm.se", true, "Anna");
    const res = await directory(viewer);
    const keys = Object.keys(res.accountants![0]);
    expect(keys.sort()).toEqual(["email", "id", "name"]);
    // explicitly not present:
    for (const bad of ["hashed_password", "hashedPassword", "subscription_tier", "email_verification_token"]) {
      expect(keys).not.toContain(bad);
    }
  });

  it("search filters by name and email", async () => {
    await reset();
    const viewer = await makeUser("v@co.se");
    await makeUser("anna@firm.se", true, "Anna Svensson");
    await makeUser("bengt@firm.se", true, "Bengt Karlsson");
    expect((await directory(viewer, "anna")).accountants!.map((a) => a.email)).toEqual(["anna@firm.se"]);
    expect((await directory(viewer, "karlsson")).accountants!.map((a) => a.email)).toEqual(["bengt@firm.se"]);
  });

  it("result size is bounded", async () => {
    await reset();
    const viewer = await makeUser("v@co.se");
    for (let i = 0; i < 30; i++) await makeUser(`acct${i}@firm.se`, true, `Acct ${i}`);
    const res = await directory(viewer, "", 20);
    expect(res.accountants!.length).toBeLessThanOrEqual(20);
  });
});

describe("Company → accountant request (reuses existing lifecycle)", () => {
  it("owner can request a discovered accountant; grants no access until accepted", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    const res = await requestConnection(owner, acct);
    expect(res.status).toBe(200);
    expect(await hasAccess(acct, company)).toBe(false); // pending ≠ access
  });

  it("admin can request; ordinary member cannot (403)", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const admin = await makeUser("admin@co.se");
    const member = await makeUser("member@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await addMember(company, admin, "admin");
    await addMember(company, member, "member");
    expect((await requestConnection(admin, acct)).status).toBe(200);
    expect((await requestConnection(member, acct)).status).toBe(403);
  });

  it("target must be an accountant (404 otherwise)", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const notAcct = await makeUser("no@x.se", false);
    await makeCompany("Client AB", owner);
    expect((await requestConnection(owner, notAcct)).status).toBe(404);
  });

  it("duplicate pending request is not stacked", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await requestConnection(owner, acct);
    const second = await requestConnection(owner, acct);
    expect((second as { alreadyPending?: boolean }).alreadyPending).toBe(true);
    expect((await pg.query(`SELECT 1 FROM accountant_connection_requests WHERE company_id=$1 AND accountant_id=$2`, [company, acct])).rows).toHaveLength(1);
  });

  it("already-active relationship blocks a duplicate (409)", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await pg.query(`INSERT INTO accountant_clients (accountant_id, company_id, status, activated_at) VALUES ($1,$2,'active',now())`, [acct, company]);
    const res = await requestConnection(owner, acct);
    expect(res.status).toBe(409);
    expect((res as { alreadyConnected?: boolean }).alreadyConnected).toBe(true);
  });

  it("company cannot request for another company (company resolved from session)", async () => {
    await reset();
    const ownerA = await makeUser("oa@co.se");
    const ownerB = await makeUser("ob@co.se");
    const acct = await makeUser("a@firm.se", true);
    await makeCompany("CoA", ownerA);
    const compB = await makeCompany("CoB", ownerB);
    await requestConnection(ownerA, acct); // ownerA's session → resolves to CoA
    const bound = (await pg.query<{ company_id: string }>(`SELECT company_id FROM accountant_connection_requests WHERE accountant_id=$1`, [acct])).rows[0].company_id;
    expect(bound).not.toBe(compB);
    expect(bound).toBe((await getUserCompany(ownerA))!.companyId);
  });

  it("multiple accountants can be requested by one company", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const a1 = await makeUser("a1@firm.se", true);
    const a2 = await makeUser("a2@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    expect((await requestConnection(owner, a1)).status).toBe(200);
    expect((await requestConnection(owner, a2)).status).toBe(200);
    expect((await pg.query(`SELECT 1 FROM accountant_connection_requests WHERE company_id=$1`, [company])).rows).toHaveLength(2);
  });
});
