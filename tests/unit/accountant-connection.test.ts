import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Integration/security tests for the company→accountant CONNECTION REQUEST flow
 * (create / list / accept / decline) against real Postgres (PGlite) with the
 * actual migrations. Replicates each route's authorization + lifecycle logic.
 */

let pg: PGlite;

async function reset() {
  await pg.exec(
    `TRUNCATE accountant_connection_requests, accountant_clients, company_members, companies, users RESTART IDENTITY CASCADE;`,
  );
}
async function makeUser(email: string, isAccountant = false) {
  return (await pg.query<{ id: string }>(
    `INSERT INTO users (email, is_accountant, scan_limit) VALUES ($1,$2,25) RETURNING id`,
    [email.toLowerCase(), isAccountant],
  )).rows[0].id;
}
async function makeCompany(name: string, ownerId: string) {
  const id = (await pg.query<{ id: string }>(`INSERT INTO companies (name) VALUES ($1) RETURNING id`, [name])).rows[0].id;
  await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'owner')`, [id, ownerId]);
  return id;
}
async function addMember(companyId: string, userId: string, role = "member") {
  await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,$3)`, [companyId, userId, role]);
}
async function getUserCompany(userId: string) {
  const [m] = (await pg.query<{ company_id: string; role: string }>(
    `SELECT company_id, role FROM company_members WHERE user_id=$1 LIMIT 1`, [userId],
  )).rows;
  return m ? { companyId: m.company_id, role: m.role } : null;
}
const canManage = (role: string) => role === "owner" || role === "admin";

/** create request (client POST) */
async function createRequest(userId: string, accountantId: string) {
  const membership = await getUserCompany(userId);
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
    await pg.query(`UPDATE accountant_connection_requests SET status='pending', requested_by=$1, responded_at=NULL WHERE id=$2`, [userId, existing.id]);
  } else {
    await pg.query(`INSERT INTO accountant_connection_requests (company_id, accountant_id, requested_by, status) VALUES ($1,$2,$3,'pending')`, [companyId, accountantId, userId]);
  }
  return { status: 200 as const, companyId };
}

/** accountant incoming list */
async function listIncoming(actor: { userId: string; isAccountant: boolean }) {
  if (!actor.isAccountant) return { status: 403 as const };
  const rows = (await pg.query(`SELECT id, company_id, status FROM accountant_connection_requests WHERE accountant_id=$1 ORDER BY created_at DESC`, [actor.userId])).rows;
  return { status: 200 as const, requests: rows as Array<{ id: string; company_id: string; status: string }> };
}

/** accept */
async function accept(actor: { userId: string; isAccountant: boolean }, requestId: string) {
  if (!actor.isAccountant) return { status: 403 as const };
  const reqRow = (await pg.query<{ id: string; company_id: string; status: string }>(`SELECT id, company_id, status FROM accountant_connection_requests WHERE id=$1 AND accountant_id=$2`, [requestId, actor.userId])).rows[0];
  if (!reqRow) return { status: 404 as const };
  if (reqRow.status !== "pending") return { status: 409 as const };
  const existing = (await pg.query<{ id: string; status: string }>(`SELECT id, status FROM accountant_clients WHERE accountant_id=$1 AND company_id=$2`, [actor.userId, reqRow.company_id])).rows[0];
  if (existing) {
    if (existing.status !== "active") await pg.query(`UPDATE accountant_clients SET status='active', activated_at=now(), revoked_at=NULL WHERE id=$1`, [existing.id]);
  } else {
    await pg.query(`INSERT INTO accountant_clients (accountant_id, company_id, status, activated_at) VALUES ($1,$2,'active',now())`, [actor.userId, reqRow.company_id]);
  }
  await pg.query(`UPDATE accountant_connection_requests SET status='active', responded_at=now() WHERE id=$1`, [reqRow.id]);
  return { status: 200 as const, companyId: reqRow.company_id };
}

/** decline */
async function decline(actor: { userId: string; isAccountant: boolean }, requestId: string) {
  if (!actor.isAccountant) return { status: 403 as const };
  const reqRow = (await pg.query<{ id: string; status: string }>(`SELECT id, status FROM accountant_connection_requests WHERE id=$1 AND accountant_id=$2`, [requestId, actor.userId])).rows[0];
  if (!reqRow) return { status: 404 as const };
  if (reqRow.status !== "pending") return { status: 409 as const };
  await pg.query(`UPDATE accountant_connection_requests SET status='revoked', responded_at=now() WHERE id=$1`, [reqRow.id]);
  return { status: 200 as const };
}

/** requireCompanyAccess (active-only) */
async function hasAccess(accountantId: string, companyId: string) {
  return (await pg.query(`SELECT 1 FROM accountant_clients WHERE accountant_id=$1 AND company_id=$2 AND status='active'`, [accountantId, companyId])).rows.length > 0;
}
async function pendingRequestId(companyId: string, accountantId: string) {
  return (await pg.query<{ id: string }>(`SELECT id FROM accountant_connection_requests WHERE company_id=$1 AND accountant_id=$2`, [companyId, accountantId])).rows[0].id;
}

beforeAll(async () => {
  pg = new PGlite();
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
});

describe("Connection requests — creation authorization", () => {
  it("company owner can create a request; target must be an accountant", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    await makeCompany("Client AB", owner);
    const res = await createRequest(owner, acct);
    expect(res.status).toBe(200);
    // no access granted merely by creating
    expect(await hasAccess(acct, (await getUserCompany(owner))!.companyId)).toBe(false);
  });

  it("company admin can create a request", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const admin = await makeUser("admin@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await addMember(company, admin, "admin");
    expect((await createRequest(admin, acct)).status).toBe(200);
  });

  it("ordinary member (not owner/admin) cannot create a request → 403", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const member = await makeUser("member@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await addMember(company, member, "member");
    expect((await createRequest(member, acct)).status).toBe(403);
  });

  it("target must actually be an accountant (isAccountant=true) → else 404", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const notAccountant = await makeUser("nope@x.se", false);
    await makeCompany("Client AB", owner);
    expect((await createRequest(owner, notAccountant)).status).toBe(404);
  });

  it("user with no company → 409 needsCompany", async () => {
    await reset();
    const solo = await makeUser("solo@x.se");
    const acct = await makeUser("a@firm.se", true);
    const res = await createRequest(solo, acct);
    expect(res.status).toBe(409);
    expect((res as { needsCompany?: boolean }).needsCompany).toBe(true);
  });

  it("duplicate pending request is not stacked", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await createRequest(owner, acct);
    const second = await createRequest(owner, acct);
    expect((second as { alreadyPending?: boolean }).alreadyPending).toBe(true);
    const rows = (await pg.query(`SELECT 1 FROM accountant_connection_requests WHERE company_id=$1 AND accountant_id=$2`, [company, acct])).rows;
    expect(rows).toHaveLength(1);
  });

  it("already-active relationship blocks a duplicate request (409 alreadyConnected)", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await pg.query(`INSERT INTO accountant_clients (accountant_id, company_id, status, activated_at) VALUES ($1,$2,'active',now())`, [acct, company]);
    const res = await createRequest(owner, acct);
    expect(res.status).toBe(409);
    expect((res as { alreadyConnected?: boolean }).alreadyConnected).toBe(true);
  });
});

describe("Connection requests — accountant visibility & response isolation", () => {
  it("accountant sees only their own incoming requests", async () => {
    await reset();
    const ownerA = await makeUser("oa@co.se");
    const ownerB = await makeUser("ob@co.se");
    const a1 = await makeUser("a1@firm.se", true);
    const a2 = await makeUser("a2@firm.se", true);
    await makeCompany("CoA", ownerA);
    await makeCompany("CoB", ownerB);
    await createRequest(ownerA, a1); // → a1
    await createRequest(ownerB, a2); // → a2
    const l1 = await listIncoming({ userId: a1, isAccountant: true });
    const l2 = await listIncoming({ userId: a2, isAccountant: true });
    expect(l1.requests).toHaveLength(1);
    expect(l2.requests).toHaveLength(1);
    expect(l1.requests![0].company_id).not.toBe(l2.requests![0].company_id);
  });

  it("non-accountant cannot list incoming → 403", async () => {
    await reset();
    const u = await makeUser("u@x.se", false);
    expect((await listIncoming({ userId: u, isAccountant: false })).status).toBe(403);
  });

  it("accountant A cannot accept accountant B's request (404)", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const a = await makeUser("a@firm.se", true);
    const b = await makeUser("b@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await createRequest(owner, b); // request targets B
    const reqId = await pendingRequestId(company, b);
    expect((await accept({ userId: a, isAccountant: true }, reqId)).status).toBe(404);
    // B's relationship not created by A's attempt
    expect(await hasAccess(a, company)).toBe(false);
    expect(await hasAccess(b, company)).toBe(false);
  });

  it("accountant A cannot decline accountant B's request (404)", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const a = await makeUser("a@firm.se", true);
    const b = await makeUser("b@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await createRequest(owner, b);
    const reqId = await pendingRequestId(company, b);
    expect((await decline({ userId: a, isAccountant: true }, reqId)).status).toBe(404);
    // still pending
    const row = (await pg.query<{ status: string }>(`SELECT status FROM accountant_connection_requests WHERE id=$1`, [reqId])).rows[0];
    expect(row.status).toBe("pending");
  });
});

describe("Connection requests — accept/decline lifecycle", () => {
  it("accept creates an active relationship and enables requireCompanyAccess immediately", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await createRequest(owner, acct);
    const reqId = await pendingRequestId(company, acct);
    expect(await hasAccess(acct, company)).toBe(false); // pending → no access
    const res = await accept({ userId: acct, isAccountant: true }, reqId);
    expect(res.status).toBe(200);
    expect(await hasAccess(acct, company)).toBe(true);
    const row = (await pg.query<{ status: string; responded_at: string | null }>(`SELECT status, responded_at FROM accountant_connection_requests WHERE id=$1`, [reqId])).rows[0];
    expect(row.status).toBe("active");
    expect(row.responded_at).not.toBeNull();
  });

  it("decline sets revoked, grants NO relationship/access", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await createRequest(owner, acct);
    const reqId = await pendingRequestId(company, acct);
    expect((await decline({ userId: acct, isAccountant: true }, reqId)).status).toBe(200);
    expect(await hasAccess(acct, company)).toBe(false);
    expect((await pg.query(`SELECT 1 FROM accountant_clients WHERE accountant_id=$1 AND company_id=$2`, [acct, company])).rows).toHaveLength(0);
    const row = (await pg.query<{ status: string }>(`SELECT status FROM accountant_connection_requests WHERE id=$1`, [reqId])).rows[0];
    expect(row.status).toBe("revoked");
  });

  it("only pending requests can be accepted/declined (already-answered → 409)", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await createRequest(owner, acct);
    const reqId = await pendingRequestId(company, acct);
    await accept({ userId: acct, isAccountant: true }, reqId);
    expect((await accept({ userId: acct, isAccountant: true }, reqId)).status).toBe(409);
    expect((await decline({ userId: acct, isAccountant: true }, reqId)).status).toBe(409);
  });

  it("declined request requires a NEW request+accept to become active (not silently active)", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await createRequest(owner, acct);
    let reqId = await pendingRequestId(company, acct);
    await decline({ userId: acct, isAccountant: true }, reqId);
    expect(await hasAccess(acct, company)).toBe(false);
    // company re-requests → reopens pending (still no access until accept)
    const re = await createRequest(owner, acct);
    expect(re.status).toBe(200);
    expect(await hasAccess(acct, company)).toBe(false);
    reqId = await pendingRequestId(company, acct);
    await accept({ userId: acct, isAccountant: true }, reqId);
    expect(await hasAccess(acct, company)).toBe(true);
  });
});

describe("Connection requests — multiple accountants & isolation", () => {
  it("a company can connect to two accountants independently", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const a1 = await makeUser("a1@firm.se", true);
    const a2 = await makeUser("a2@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await createRequest(owner, a1);
    await accept({ userId: a1, isAccountant: true }, await pendingRequestId(company, a1));
    await createRequest(owner, a2);
    await accept({ userId: a2, isAccountant: true }, await pendingRequestId(company, a2));
    expect(await hasAccess(a1, company)).toBe(true);
    expect(await hasAccess(a2, company)).toBe(true);
    // exactly one relationship row per (accountant, company)
    expect((await pg.query(`SELECT 1 FROM accountant_clients WHERE company_id=$1`, [company])).rows).toHaveLength(2);
  });

  it("company ID cannot be manipulated: request is always bound to the requester's own company", async () => {
    await reset();
    const ownerA = await makeUser("oa@co.se");
    const ownerB = await makeUser("ob@co.se");
    const acct = await makeUser("a@firm.se", true);
    await makeCompany("CoA", ownerA);
    const compB = await makeCompany("CoB", ownerB);
    // ownerA requests — server resolves ownerA's OWN company, never compB
    await createRequest(ownerA, acct);
    const boundCompany = (await pg.query<{ company_id: string }>(`SELECT company_id FROM accountant_connection_requests WHERE accountant_id=$1`, [acct])).rows[0].company_id;
    expect(boundCompany).not.toBe(compB);
    expect(boundCompany).toBe((await getUserCompany(ownerA))!.companyId);
  });
});
