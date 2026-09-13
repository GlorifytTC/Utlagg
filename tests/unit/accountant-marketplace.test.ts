import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Integration/security tests for the accountant MARKETPLACE: company discovery
 * opt-in, accountant company-discovery, accountant→company request, and
 * company-side accept/decline — against real Postgres (PGlite) with the actual
 * migrations (incl. 0011 discovery columns). Replicates each route's authz +
 * query logic.
 */

let pg: PGlite;

async function reset() {
  await pg.exec(`TRUNCATE accountant_connection_requests, accountant_clients, company_members, companies, users RESTART IDENTITY CASCADE;`);
}
async function makeUser(email: string, isAccountant = false, name: string | null = null) {
  return (await pg.query<{ id: string }>(`INSERT INTO users (email, name, is_accountant, scan_limit) VALUES ($1,$2,$3,25) RETURNING id`, [email.toLowerCase(), name, isAccountant])).rows[0].id;
}
async function makeCompany(name: string, ownerId: string, opts: { discoverable?: boolean; city?: string; industry?: string; desc?: string } = {}) {
  const id = (await pg.query<{ id: string }>(
    `INSERT INTO companies (name, city, accountant_discoverable, industry, discovery_description) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [name, opts.city ?? null, opts.discoverable ?? false, opts.industry ?? null, opts.desc ?? null],
  )).rows[0].id;
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

/** GET /api/accountant/discover/companies — accountant only, discoverable only, safe fields. */
async function discover(actor: { userId: string; isAccountant: boolean }, q = "", city = "") {
  if (!actor.isAccountant) return { status: 403 as const };
  let sql = `SELECT id, name, city, industry, discovery_description AS description FROM companies WHERE accountant_discoverable=true`;
  const params: unknown[] = [];
  if (q) { params.push(`%${q}%`); sql += ` AND (name ILIKE $${params.length} OR discovery_description ILIKE $${params.length})`; }
  if (city) { params.push(`%${city}%`); sql += ` AND city ILIKE $${params.length}`; }
  sql += ` ORDER BY created_at DESC, name`;
  return { status: 200 as const, companies: (await pg.query(sql, params)).rows as Array<Record<string, unknown>> };
}

/** PATCH /api/company/discovery — owner/admin only. */
async function setDiscovery(userId: string, patch: { accountantDiscoverable?: boolean; industry?: string }) {
  const m = await getUserCompany(userId);
  if (!m) return { status: 404 as const };
  if (!canManage(m.role)) return { status: 403 as const };
  const sets: string[] = [];
  const params: unknown[] = [];
  if (patch.accountantDiscoverable !== undefined) { params.push(patch.accountantDiscoverable); sets.push(`accountant_discoverable=$${params.length}`); }
  if (patch.industry !== undefined) { params.push(patch.industry); sets.push(`industry=$${params.length}`); }
  params.push(m.companyId);
  await pg.query(`UPDATE companies SET ${sets.join(", ")} WHERE id=$${params.length}`, params);
  return { status: 200 as const, companyId: m.companyId };
}

/** POST /api/accountant/connection-requests/company — accountant→discoverable company. */
async function accountantRequest(actor: { userId: string; isAccountant: boolean }, companyId: string) {
  if (!actor.isAccountant) return { status: 403 as const };
  const c = (await pg.query<{ discoverable: boolean }>(`SELECT accountant_discoverable AS discoverable FROM companies WHERE id=$1`, [companyId])).rows[0];
  if (!c || !c.discoverable) return { status: 404 as const };
  const active = (await pg.query(`SELECT 1 FROM accountant_clients WHERE accountant_id=$1 AND company_id=$2 AND status='active'`, [actor.userId, companyId])).rows;
  if (active.length) return { status: 409 as const, alreadyConnected: true };
  const existing = (await pg.query<{ id: string; status: string }>(`SELECT id, status FROM accountant_connection_requests WHERE company_id=$1 AND accountant_id=$2`, [companyId, actor.userId])).rows[0];
  if (existing) {
    if (existing.status === "pending") return { status: 200 as const, alreadyPending: true };
    await pg.query(`UPDATE accountant_connection_requests SET status='pending', requested_by=$1, responded_at=NULL WHERE id=$2`, [actor.userId, existing.id]);
  } else {
    await pg.query(`INSERT INTO accountant_connection_requests (company_id, accountant_id, requested_by, status) VALUES ($1,$2,$3,'pending')`, [companyId, actor.userId, actor.userId]);
  }
  return { status: 200 as const };
}

/** POST /api/company/accountant-requests/[id]/accept — company owner/admin. */
async function companyAccept(userId: string, requestId: string) {
  const m = await getUserCompany(userId);
  if (!m) return { status: 404 as const };
  if (!canManage(m.role)) return { status: 403 as const };
  const reqRow = (await pg.query<{ id: string; accountant_id: string; status: string }>(`SELECT id, accountant_id, status FROM accountant_connection_requests WHERE id=$1 AND company_id=$2`, [requestId, m.companyId])).rows[0];
  if (!reqRow) return { status: 404 as const };
  if (reqRow.status !== "pending") return { status: 409 as const };
  const ex = (await pg.query<{ id: string; status: string }>(`SELECT id, status FROM accountant_clients WHERE accountant_id=$1 AND company_id=$2`, [reqRow.accountant_id, m.companyId])).rows[0];
  if (ex) { if (ex.status !== "active") await pg.query(`UPDATE accountant_clients SET status='active', activated_at=now(), revoked_at=NULL WHERE id=$1`, [ex.id]); }
  else await pg.query(`INSERT INTO accountant_clients (accountant_id, company_id, status, activated_at) VALUES ($1,$2,'active',now())`, [reqRow.accountant_id, m.companyId]);
  await pg.query(`UPDATE accountant_connection_requests SET status='active', responded_at=now() WHERE id=$1`, [reqRow.id]);
  return { status: 200 as const, companyId: m.companyId, accountantId: reqRow.accountant_id };
}
async function companyDecline(userId: string, requestId: string) {
  const m = await getUserCompany(userId);
  if (!m || !canManage(m.role)) return { status: 403 as const };
  const reqRow = (await pg.query<{ id: string; status: string }>(`SELECT id, status FROM accountant_connection_requests WHERE id=$1 AND company_id=$2`, [requestId, m.companyId])).rows[0];
  if (!reqRow) return { status: 404 as const };
  if (reqRow.status !== "pending") return { status: 409 as const };
  await pg.query(`UPDATE accountant_connection_requests SET status='revoked', responded_at=now() WHERE id=$1`, [reqRow.id]);
  return { status: 200 as const };
}
async function hasAccess(accountantId: string, companyId: string) {
  return (await pg.query(`SELECT 1 FROM accountant_clients WHERE accountant_id=$1 AND company_id=$2 AND status='active'`, [accountantId, companyId])).rows.length > 0;
}
async function pendingReqId(companyId: string, accountantId: string) {
  return (await pg.query<{ id: string }>(`SELECT id FROM accountant_connection_requests WHERE company_id=$1 AND accountant_id=$2`, [companyId, accountantId])).rows[0].id;
}

beforeAll(async () => {
  pg = new PGlite();
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
});

describe("Company discovery profile", () => {
  it("owner can enable discovery; ordinary member cannot", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const member = await makeUser("m@co.se");
    const company = await makeCompany("Co", owner);
    await addMember(company, member, "member");
    expect((await setDiscovery(owner, { accountantDiscoverable: true })).status).toBe(200);
    expect((await setDiscovery(member, { accountantDiscoverable: false })).status).toBe(403);
  });
});

describe("Accountant company discovery", () => {
  it("accountant sees ONLY discoverable companies; non-discoverable never appears", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    const o1 = await makeUser("o1@co.se");
    const o2 = await makeUser("o2@co.se");
    await makeCompany("Visible AB", o1, { discoverable: true, city: "Stockholm", industry: "IT" });
    await makeCompany("Hidden AB", o2, { discoverable: false });
    const res = await discover({ userId: acct, isAccountant: true });
    expect(res.status).toBe(200);
    expect(res.companies!.map((c) => c.name)).toEqual(["Visible AB"]);
  });

  it("non-accountant → 403", async () => {
    await reset();
    const u = await makeUser("u@co.se", false);
    expect((await discover({ userId: u, isAccountant: false })).status).toBe(403);
  });

  it("returns only safe fields (no org/vat/receipts/members)", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    const o = await makeUser("o@co.se");
    await makeCompany("Co", o, { discoverable: true });
    const res = await discover({ userId: acct, isAccountant: true });
    const keys = Object.keys(res.companies![0]);
    expect(keys.sort()).toEqual(["city", "description", "id", "industry", "name"]);
  });

  it("search + city filter work", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    const o1 = await makeUser("o1@co.se");
    const o2 = await makeUser("o2@co.se");
    await makeCompany("Alfa Bygg", o1, { discoverable: true, city: "Göteborg" });
    await makeCompany("Beta IT", o2, { discoverable: true, city: "Stockholm" });
    expect((await discover({ userId: acct, isAccountant: true }, "Alfa")).companies!.map((c) => c.name)).toEqual(["Alfa Bygg"]);
    expect((await discover({ userId: acct, isAccountant: true }, "", "Stockholm")).companies!.map((c) => c.name)).toEqual(["Beta IT"]);
  });
});

describe("Accountant → company request + company accept/decline", () => {
  it("accountant requests a discoverable company; no access until accepted", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Co", owner, { discoverable: true });
    expect((await accountantRequest({ userId: acct, isAccountant: true }, company)).status).toBe(200);
    expect(await hasAccess(acct, company)).toBe(false); // pending ≠ access
  });

  it("cannot request a NON-discoverable company (404)", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Hidden", owner, { discoverable: false });
    expect((await accountantRequest({ userId: acct, isAccountant: true }, company)).status).toBe(404);
  });

  it("non-accountant cannot request", async () => {
    await reset();
    const u = await makeUser("u@co.se", false);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Co", owner, { discoverable: true });
    expect((await accountantRequest({ userId: u, isAccountant: false }, company)).status).toBe(403);
  });

  it("duplicate pending request is safe (not stacked)", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Co", owner, { discoverable: true });
    await accountantRequest({ userId: acct, isAccountant: true }, company);
    const second = await accountantRequest({ userId: acct, isAccountant: true }, company);
    expect((second as { alreadyPending?: boolean }).alreadyPending).toBe(true);
    expect((await pg.query(`SELECT 1 FROM accountant_connection_requests WHERE company_id=$1 AND accountant_id=$2`, [company, acct])).rows).toHaveLength(1);
  });

  it("company accept activates the relationship; accountant then has access", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Co", owner, { discoverable: true });
    await accountantRequest({ userId: acct, isAccountant: true }, company);
    const rid = await pendingReqId(company, acct);
    expect((await companyAccept(owner, rid)).status).toBe(200);
    expect(await hasAccess(acct, company)).toBe(true);
  });

  it("company decline grants no access", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Co", owner, { discoverable: true });
    await accountantRequest({ userId: acct, isAccountant: true }, company);
    const rid = await pendingReqId(company, acct);
    expect((await companyDecline(owner, rid)).status).toBe(200);
    expect(await hasAccess(acct, company)).toBe(false);
  });

  it("another company cannot accept a request addressed to a different company (404)", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    const ownerA = await makeUser("oa@co.se");
    const ownerB = await makeUser("ob@co.se");
    const compA = await makeCompany("A", ownerA, { discoverable: true });
    await makeCompany("B", ownerB, { discoverable: true });
    await accountantRequest({ userId: acct, isAccountant: true }, compA); // request to A
    const rid = await pendingReqId(compA, acct);
    // ownerB tries to accept A's request → scoped to B's company → 404
    expect((await companyAccept(ownerB, rid)).status).toBe(404);
  });

  it("multiple accountants can request/connect to the same company", async () => {
    await reset();
    const a1 = await makeUser("a1@firm.se", true);
    const a2 = await makeUser("a2@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Co", owner, { discoverable: true });
    await accountantRequest({ userId: a1, isAccountant: true }, company);
    await accountantRequest({ userId: a2, isAccountant: true }, company);
    await companyAccept(owner, await pendingReqId(company, a1));
    await companyAccept(owner, await pendingReqId(company, a2));
    expect(await hasAccess(a1, company)).toBe(true);
    expect(await hasAccess(a2, company)).toBe(true);
  });
});
