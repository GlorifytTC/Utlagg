import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Integration/security tests for the CLIENT-SIDE REVOKE flow against real
 * Postgres (PGlite) with the actual migrations. Replicates the revoke route's
 * authorization + mutation logic, and verifies that after revoke every
 * accountant capability (list / read / edit / export) loses access — all of
 * which key off requireCompanyAccess returning null for a non-active relationship.
 */

let pg: PGlite;

async function reset() {
  await pg.exec(
    `TRUNCATE accountant_clients, company_members, companies, receipts, users RESTART IDENTITY CASCADE;`,
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
async function relate(accountantId: string, companyId: string, status: string) {
  return (await pg.query<{ id: string }>(
    `INSERT INTO accountant_clients (accountant_id, company_id, status, activated_at) VALUES ($1,$2,$3,now()) RETURNING id`,
    [accountantId, companyId, status],
  )).rows[0].id;
}
async function makeReceipt(userId: string) {
  return (await pg.query<{ id: string }>(
    `INSERT INTO receipts (user_id, vendor_name, total_amount, date, status) VALUES ($1,'ICA',100.00,now(),'approved') RETURNING id`,
    [userId],
  )).rows[0].id;
}

async function getUserCompany(userId: string) {
  const [m] = (await pg.query<{ company_id: string; role: string }>(
    `SELECT company_id, role FROM company_members WHERE user_id=$1 LIMIT 1`, [userId],
  )).rows;
  return m ? { companyId: m.company_id, role: m.role } : null;
}
const canManage = (role: string) => role === "owner" || role === "admin";

/** requireCompanyAccess (active only) — used by ALL accountant read/edit/export. */
async function requireCompanyAccess(accountantId: string, companyId: string) {
  const rel = (await pg.query(`SELECT 1 FROM accountant_clients WHERE accountant_id=$1 AND company_id=$2 AND status='active' LIMIT 1`, [accountantId, companyId])).rows;
  if (rel.length === 0) return null;
  const memberIds = (await pg.query<{ user_id: string }>(`SELECT user_id FROM company_members WHERE company_id=$1`, [companyId])).rows.map((m) => m.user_id);
  return { companyId, memberIds };
}
async function listsClient(accountantId: string, companyId: string) {
  return (await requireCompanyAccess(accountantId, companyId)) !== null;
}
async function canReadReceipts(accountantId: string, companyId: string) {
  return (await requireCompanyAccess(accountantId, companyId)) !== null;
}
async function canEditReceipt(accountantId: string, companyId: string) {
  return (await requireCompanyAccess(accountantId, companyId)) !== null;
}
async function canExport(accountantId: string, companyId: string) {
  return (await requireCompanyAccess(accountantId, companyId)) !== null;
}

/** Replicates the revoke route. */
async function revoke(actorUserId: string | null, targetAccountantId: string, authenticated = true) {
  if (!authenticated || !actorUserId) return { status: 401 as const };
  const membership = await getUserCompany(actorUserId);
  if (!membership) return { status: 404 as const };
  if (!canManage(membership.role)) return { status: 403 as const };
  const companyId = membership.companyId;

  const rel = (await pg.query<{ id: string; status: string }>(
    `SELECT id, status FROM accountant_clients WHERE company_id=$1 AND accountant_id=$2 LIMIT 1`,
    [companyId, targetAccountantId],
  )).rows[0];
  if (!rel || rel.status !== "active") return { status: 404 as const };

  await pg.query(
    `UPDATE accountant_clients SET status='revoked', revoked_at=now(), revoked_by=$1 WHERE id=$2 AND company_id=$3 AND status='active'`,
    [actorUserId, rel.id, companyId],
  );
  return { status: 200 as const, relId: rel.id, companyId };
}
async function relRow(id: string) {
  return (await pg.query(`SELECT * FROM accountant_clients WHERE id=$1`, [id])).rows[0] as Record<string, unknown>;
}

beforeAll(async () => {
  pg = new PGlite();
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
});

describe("Client revoke — authorization & IDOR", () => {
  it("company owner can revoke an active accountant", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await relate(acct, company, "active");
    const res = await revoke(owner, acct);
    expect(res.status).toBe(200);
    expect(await requireCompanyAccess(acct, company)).toBeNull();
  });

  it("authorized company admin can revoke", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const admin = await makeUser("admin@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await addMember(company, admin, "admin");
    await relate(acct, company, "active");
    expect((await revoke(admin, acct)).status).toBe(200);
  });

  it("ordinary member cannot revoke → 403", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const member = await makeUser("member@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await addMember(company, member, "member");
    await relate(acct, company, "active");
    expect((await revoke(member, acct)).status).toBe(403);
    // still active
    expect(await requireCompanyAccess(acct, company)).not.toBeNull();
  });

  it("unauthenticated cannot revoke → 401", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    expect((await revoke(null, acct, false)).status).toBe(401);
  });

  it("Company A cannot revoke Accountant X's relationship with Company B (id manipulation)", async () => {
    await reset();
    const ownerA = await makeUser("oa@co.se");
    const ownerB = await makeUser("ob@co.se");
    const acct = await makeUser("x@firm.se", true);
    await makeCompany("CoA", ownerA); // ownerA's company
    const compB = await makeCompany("CoB", ownerB);
    await relate(acct, compB, "active"); // acct works for CoB, NOT CoA
    // ownerA tries to revoke acct (knows the accountant id) → resolves to CoA,
    // finds no relationship there → 404; CoB relationship untouched.
    expect((await revoke(ownerA, acct)).status).toBe(404);
    expect(await requireCompanyAccess(acct, compB)).not.toBeNull();
  });
});

describe("Client revoke — lifecycle & pending", () => {
  it("sets status/revokedAt/revokedBy and preserves the row (no delete)", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    const relId = await relate(acct, company, "active");
    await revoke(owner, acct);
    const row = await relRow(relId);
    expect(row.status).toBe("revoked");
    expect(row.revoked_at).not.toBeNull();
    expect(row.revoked_by).toBe(owner);
    // row still exists (history preserved)
    expect((await pg.query(`SELECT 1 FROM accountant_clients WHERE id=$1`, [relId])).rows).toHaveLength(1);
  });

  it("a PENDING relationship cannot be revoked as active → 404, and stays pending", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    const relId = await relate(acct, company, "pending");
    expect((await revoke(owner, acct)).status).toBe(404);
    expect((await relRow(relId)).status).toBe("pending");
  });

  it("no active relationship at all → 404 (creates nothing)", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    expect((await revoke(owner, acct)).status).toBe(404);
    expect((await pg.query(`SELECT 1 FROM accountant_clients WHERE company_id=$1`, [company])).rows).toHaveLength(0);
  });

  it("repeated revoke is a no-op after the first (second → 404)", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await relate(acct, company, "active");
    expect((await revoke(owner, acct)).status).toBe(200);
    expect((await revoke(owner, acct)).status).toBe(404); // already revoked
  });
});

describe("Client revoke — capability loss after revoke", () => {
  it("accountant loses list/read/edit/export access immediately after revoke", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await relate(acct, company, "active");
    await makeReceipt(owner);
    // before
    expect(await listsClient(acct, company)).toBe(true);
    expect(await canReadReceipts(acct, company)).toBe(true);
    expect(await canEditReceipt(acct, company)).toBe(true);
    expect(await canExport(acct, company)).toBe(true);
    // revoke
    await revoke(owner, acct);
    // after — every capability gone
    expect(await listsClient(acct, company)).toBe(false);
    expect(await canReadReceipts(acct, company)).toBe(false);
    expect(await canEditReceipt(acct, company)).toBe(false);
    expect(await canExport(acct, company)).toBe(false);
  });
});

describe("Client revoke — multiple accountants isolation", () => {
  it("revoking A leaves B (same company) untouched", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const a = await makeUser("a@firm.se", true);
    const b = await makeUser("b@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    await relate(b, company, "active");
    await revoke(owner, a);
    expect(await requireCompanyAccess(a, company)).toBeNull();
    expect(await requireCompanyAccess(b, company)).not.toBeNull();
  });

  it("revoking an accountant at one company leaves their OTHER clients intact", async () => {
    await reset();
    const ownerX = await makeUser("ox@co.se");
    const ownerY = await makeUser("oy@co.se");
    const acct = await makeUser("a@firm.se", true);
    const compX = await makeCompany("X AB", ownerX);
    const compY = await makeCompany("Y AB", ownerY);
    await relate(acct, compX, "active");
    await relate(acct, compY, "active");
    await revoke(ownerX, acct); // ownerX revokes at X only
    expect(await requireCompanyAccess(acct, compX)).toBeNull();
    expect(await requireCompanyAccess(acct, compY)).not.toBeNull(); // Y intact
  });

  it("only the target relationship row is modified", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const a = await makeUser("a@firm.se", true);
    const b = await makeUser("b@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    const bRelId = await relate(b, company, "active");
    await revoke(owner, a);
    expect((await relRow(bRelId)).status).toBe("active"); // B unchanged
  });
});
