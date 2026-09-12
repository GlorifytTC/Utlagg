import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Integration/security tests for GET /api/company/accountants. Replicates the
 * route's authorization + query: authenticated → caller's CURRENT company →
 * canManageCompany → active accountantClients for that company only.
 */

let pg: PGlite;

async function reset() {
  await pg.exec(`TRUNCATE accountant_clients, company_members, companies, users RESTART IDENTITY CASCADE;`);
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
  await pg.query(`INSERT INTO accountant_clients (accountant_id, company_id, status, activated_at) VALUES ($1,$2,$3,now())`, [accountantId, companyId, status]);
}
async function getUserCompany(userId: string) {
  const [m] = (await pg.query<{ company_id: string; role: string }>(`SELECT company_id, role FROM company_members WHERE user_id=$1 LIMIT 1`, [userId])).rows;
  return m ? { companyId: m.company_id, role: m.role } : null;
}
const canManage = (role: string) => role === "owner" || role === "admin";

/** Replicates the route. authenticated=false → 401. */
async function listAccountants(userId: string | null) {
  if (!userId) return { status: 401 as const };
  const membership = await getUserCompany(userId);
  if (!membership) return { status: 404 as const };
  if (!canManage(membership.role)) return { status: 403 as const };
  const rows = (await pg.query<{ accountant_id: string; email: string; status: string }>(
    `SELECT ac.id as relationship_id, ac.accountant_id, u.email, ac.status
     FROM accountant_clients ac JOIN users u ON u.id = ac.accountant_id
     WHERE ac.company_id=$1 AND ac.status='active'`,
    [membership.companyId],
  )).rows;
  return { status: 200 as const, accountants: rows };
}

beforeAll(async () => {
  pg = new PGlite();
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
});

describe("GET /api/company/accountants", () => {
  it("owner can list active accountants", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await relate(acct, company, "active");
    const res = await listAccountants(owner);
    expect(res.status).toBe(200);
    expect(res.accountants).toHaveLength(1);
    expect(res.accountants![0].email).toBe("a@firm.se");
  });

  it("admin can list active accountants", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const admin = await makeUser("admin@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await addMember(company, admin, "admin");
    await relate(acct, company, "active");
    expect((await listAccountants(admin)).status).toBe(200);
  });

  it("ordinary member cannot list → 403", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const member = await makeUser("member@co.se");
    const acct = await makeUser("a@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await addMember(company, member, "member");
    await relate(acct, company, "active");
    expect((await listAccountants(member)).status).toBe(403);
  });

  it("unauthenticated → 401", async () => {
    await reset();
    expect((await listAccountants(null)).status).toBe(401);
  });

  it("user with no company → 404", async () => {
    await reset();
    const solo = await makeUser("solo@x.se");
    expect((await listAccountants(solo)).status).toBe(404);
  });

  it("Company A cannot see Company B's accountants (session-scoped)", async () => {
    await reset();
    const ownerA = await makeUser("oa@co.se");
    const ownerB = await makeUser("ob@co.se");
    const acctB = await makeUser("b@firm.se", true);
    await makeCompany("CoA", ownerA);
    const compB = await makeCompany("CoB", ownerB);
    await relate(acctB, compB, "active"); // B's accountant on CoB
    // ownerA lists → resolves to CoA → sees nothing from CoB
    const res = await listAccountants(ownerA);
    expect(res.status).toBe(200);
    expect(res.accountants).toHaveLength(0);
  });

  it("only ACTIVE relationships returned; pending & revoked excluded", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const active = await makeUser("active@firm.se", true);
    const pending = await makeUser("pending@firm.se", true);
    const revoked = await makeUser("revoked@firm.se", true);
    const company = await makeCompany("Client AB", owner);
    await relate(active, company, "active");
    await relate(pending, company, "pending");
    await relate(revoked, company, "revoked");
    const res = await listAccountants(owner);
    expect(res.accountants!.map((a) => a.email)).toEqual(["active@firm.se"]);
  });

  it("does not leak another accountant's relationship from a different company", async () => {
    await reset();
    const owner = await makeUser("owner@co.se");
    const myAcct = await makeUser("mine@firm.se", true);
    const otherAcct = await makeUser("other@firm.se", true);
    const myCompany = await makeCompany("Mine AB", owner);
    const otherCompany = await makeCompany("Other AB", await makeUser("o2@co.se"));
    await relate(myAcct, myCompany, "active");
    await relate(otherAcct, otherCompany, "active");
    const res = await listAccountants(owner);
    expect(res.accountants!.map((a) => a.email)).toEqual(["mine@firm.se"]);
  });
});
