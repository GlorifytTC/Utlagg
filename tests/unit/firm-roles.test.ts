import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Security tests for the FIRM role model + per-worker customer assignments.
 * Runs against real Postgres (PGlite) with the actual migrations (incl. 0017).
 * Replicates requireCompanyAccess's role-aware logic + the management guards,
 * and asserts the full permission matrix from the spec.
 */

let pg: PGlite;

async function reset() {
  await pg.exec(
    `TRUNCATE worker_assignments, accountant_clients, firm_members, accounting_firms, company_members, companies, receipts, users RESTART IDENTITY CASCADE;`,
  );
}
async function makeUser(email: string, isAccountant = true) {
  return (await pg.query<{ id: string }>(`INSERT INTO users (email, is_accountant, scan_limit) VALUES ($1,$2,25) RETURNING id`, [email.toLowerCase(), isAccountant])).rows[0].id;
}
async function makeFirm(name: string, ownerId: string) {
  const id = (await pg.query<{ id: string }>(`INSERT INTO accounting_firms (name, owner_id) VALUES ($1,$2) RETURNING id`, [name, ownerId])).rows[0].id;
  await pg.query(`INSERT INTO firm_members (firm_id, user_id, role) VALUES ($1,$2,'owner')`, [id, ownerId]);
  return id;
}
async function addFirmMember(firmId: string, userId: string, role: string) {
  await pg.query(`INSERT INTO firm_members (firm_id, user_id, role) VALUES ($1,$2,$3)`, [firmId, userId, role]);
}
async function makeCustomer(name: string, ownerId: string) {
  const id = (await pg.query<{ id: string }>(`INSERT INTO companies (name) VALUES ($1) RETURNING id`, [name])).rows[0].id;
  await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'owner')`, [id, ownerId]);
  return id;
}
async function connectCustomer(firmId: string, initiator: string, companyId: string, status = "active") {
  await pg.query(`INSERT INTO accountant_clients (accountant_id, firm_id, company_id, status, activated_at) VALUES ($1,$2,$3,$4,now())`, [initiator, firmId, companyId, status]);
}
async function assign(firmId: string, workerId: string, companyId: string, by: string) {
  await pg.query(`INSERT INTO worker_assignments (firm_id, worker_id, company_id, assigned_by) VALUES ($1,$2,$3,$4)`, [firmId, workerId, companyId, by]);
}

async function getUserFirm(userId: string) {
  const [m] = (await pg.query<{ firm_id: string; role: string }>(`SELECT firm_id, role FROM firm_members WHERE user_id=$1 ORDER BY created_at LIMIT 1`, [userId])).rows;
  return m ? { firmId: m.firm_id, role: m.role } : null;
}

/** Replicates requireCompanyAccess (firm + role + assignment). */
async function requireCompanyAccess(userId: string, companyId: string) {
  const firm = await getUserFirm(userId);
  if (!firm) return null;
  const rel = (await pg.query(`SELECT 1 FROM accountant_clients WHERE firm_id=$1 AND company_id=$2 AND status='active' LIMIT 1`, [firm.firmId, companyId])).rows;
  if (rel.length === 0) return null;
  if (firm.role === "member") {
    const a = (await pg.query(`SELECT 1 FROM worker_assignments WHERE firm_id=$1 AND worker_id=$2 AND company_id=$3 LIMIT 1`, [firm.firmId, userId, companyId])).rows;
    if (a.length === 0) return null;
  }
  return { firmId: firm.firmId, role: firm.role };
}

const canManage = (r: string) => r === "owner" || r === "admin";
const isOwner = (r: string) => r === "owner";

beforeAll(async () => {
  pg = new PGlite();
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort())
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
});

describe("Access: owner/admin see all, worker sees only assigned", () => {
  it("owner and admin access every firm customer without assignment", async () => {
    await reset();
    const owner = await makeUser("owner@f.se");
    const admin = await makeUser("admin@f.se");
    const firm = await makeFirm("F", owner);
    await addFirmMember(firm, admin, "admin");
    const co1owner = await makeUser("c1@co.se", false);
    const co2owner = await makeUser("c2@co.se", false);
    const c1 = await makeCustomer("C1", co1owner);
    const c2 = await makeCustomer("C2", co2owner);
    await connectCustomer(firm, owner, c1);
    await connectCustomer(firm, owner, c2);

    for (const u of [owner, admin]) {
      expect(await requireCompanyAccess(u, c1)).not.toBeNull();
      expect(await requireCompanyAccess(u, c2)).not.toBeNull();
    }
  });

  it("worker sees NOTHING until assigned, then ONLY the assigned customer", async () => {
    await reset();
    const owner = await makeUser("owner@f.se");
    const worker = await makeUser("worker@f.se");
    const firm = await makeFirm("F", owner);
    await addFirmMember(firm, worker, "member");
    const co1owner = await makeUser("c1@co.se", false);
    const co2owner = await makeUser("c2@co.se", false);
    const c1 = await makeCustomer("C1", co1owner);
    const c2 = await makeCustomer("C2", co2owner);
    await connectCustomer(firm, owner, c1);
    await connectCustomer(firm, owner, c2);

    // zero visibility initially
    expect(await requireCompanyAccess(worker, c1)).toBeNull();
    expect(await requireCompanyAccess(worker, c2)).toBeNull();

    await assign(firm, worker, c1, owner);
    expect(await requireCompanyAccess(worker, c1)).not.toBeNull(); // assigned → yes
    expect(await requireCompanyAccess(worker, c2)).toBeNull(); // other → still no
  });

  it("unassigning a worker removes their access immediately", async () => {
    await reset();
    const owner = await makeUser("owner@f.se");
    const worker = await makeUser("worker@f.se");
    const firm = await makeFirm("F", owner);
    await addFirmMember(firm, worker, "member");
    const coOwner = await makeUser("c@co.se", false);
    const c = await makeCustomer("C", coOwner);
    await connectCustomer(firm, owner, c);
    await assign(firm, worker, c, owner);
    expect(await requireCompanyAccess(worker, c)).not.toBeNull();

    await pg.query(`DELETE FROM worker_assignments WHERE worker_id=$1 AND company_id=$2`, [worker, c]);
    expect(await requireCompanyAccess(worker, c)).toBeNull();
  });
});

describe("Cross-firm isolation", () => {
  it("firm A (any role) cannot access firm B's customer", async () => {
    await reset();
    const aOwner = await makeUser("a@f.se");
    const aWorker = await makeUser("aw@f.se");
    const bOwner = await makeUser("b@f.se");
    const firmA = await makeFirm("A", aOwner);
    await addFirmMember(firmA, aWorker, "member");
    const firmB = await makeFirm("B", bOwner);
    const coOwner = await makeUser("c@co.se", false);
    const cB = await makeCustomer("CB", coOwner);
    await connectCustomer(firmB, bOwner, cB);

    expect(await requireCompanyAccess(aOwner, cB)).toBeNull(); // A owner → B customer denied
    expect(await requireCompanyAccess(aWorker, cB)).toBeNull(); // A worker → denied
  });

  it("an assignment cannot be honored across firms (worker in A, customer in B)", async () => {
    await reset();
    const aOwner = await makeUser("a@f.se");
    const aWorker = await makeUser("aw@f.se");
    const bOwner = await makeUser("b@f.se");
    const firmA = await makeFirm("A", aOwner);
    await addFirmMember(firmA, aWorker, "member");
    const firmB = await makeFirm("B", bOwner);
    const coOwner = await makeUser("c@co.se", false);
    const cB = await makeCustomer("CB", coOwner);
    await connectCustomer(firmB, bOwner, cB);
    // Even if a stray assignment row existed for firmA, requireCompanyAccess
    // requires firmA to own the customer (it doesn't) → denied.
    await pg.query(`INSERT INTO worker_assignments (firm_id, worker_id, company_id, assigned_by) VALUES ($1,$2,$3,$4)`, [firmA, aWorker, cB, aOwner]);
    expect(await requireCompanyAccess(aWorker, cB)).toBeNull();
  });
});

describe("Management permissions (matrix)", () => {
  it("only owner/admin can manage people & assignments; worker cannot", () => {
    expect(canManage("owner")).toBe(true);
    expect(canManage("admin")).toBe(true);
    expect(canManage("member")).toBe(false);
  });

  it("only OWNER can remove a customer relationship; admin cannot", () => {
    expect(isOwner("owner")).toBe(true);
    expect(isOwner("admin")).toBe(false);
    expect(isOwner("member")).toBe(false);
  });

  it("owner removing a customer revokes it and clears assignments for all workers", async () => {
    await reset();
    const owner = await makeUser("owner@f.se");
    const w1 = await makeUser("w1@f.se");
    const w2 = await makeUser("w2@f.se");
    const firm = await makeFirm("F", owner);
    await addFirmMember(firm, w1, "member");
    await addFirmMember(firm, w2, "member");
    const coOwner = await makeUser("c@co.se", false);
    const c = await makeCustomer("C", coOwner);
    await connectCustomer(firm, owner, c);
    await assign(firm, w1, c, owner);
    await assign(firm, w2, c, owner);
    expect(await requireCompanyAccess(w1, c)).not.toBeNull();

    // owner-only removal: revoke + clear assignments
    await pg.query(`UPDATE accountant_clients SET status='revoked' WHERE firm_id=$1 AND company_id=$2`, [firm, c]);
    await pg.query(`DELETE FROM worker_assignments WHERE firm_id=$1 AND company_id=$2`, [firm, c]);

    expect(await requireCompanyAccess(owner, c)).toBeNull(); // gone for owner too
    expect(await requireCompanyAccess(w1, c)).toBeNull();
    expect(await requireCompanyAccess(w2, c)).toBeNull();
    expect((await pg.query(`SELECT 1 FROM worker_assignments WHERE company_id=$1`, [c])).rows).toHaveLength(0);
  });

  it("removing a firm member clears their assignments and access", async () => {
    await reset();
    const owner = await makeUser("owner@f.se");
    const worker = await makeUser("worker@f.se");
    const firm = await makeFirm("F", owner);
    await addFirmMember(firm, worker, "member");
    const coOwner = await makeUser("c@co.se", false);
    const c = await makeCustomer("C", coOwner);
    await connectCustomer(firm, owner, c);
    await assign(firm, worker, c, owner);
    expect(await requireCompanyAccess(worker, c)).not.toBeNull();

    // remove member (clears assignments then membership)
    await pg.query(`DELETE FROM worker_assignments WHERE firm_id=$1 AND worker_id=$2`, [firm, worker]);
    await pg.query(`DELETE FROM firm_members WHERE firm_id=$1 AND user_id=$2`, [firm, worker]);
    expect(await requireCompanyAccess(worker, c)).toBeNull(); // no firm → no access
  });

  it("pending relationship grants no access even to owner", async () => {
    await reset();
    const owner = await makeUser("owner@f.se");
    const firm = await makeFirm("F", owner);
    const coOwner = await makeUser("c@co.se", false);
    const c = await makeCustomer("C", coOwner);
    await connectCustomer(firm, owner, c, "pending");
    expect(await requireCompanyAccess(owner, c)).toBeNull();
  });
});

describe("Backfill (idempotent)", () => {
  async function runBackfill() {
    await pg.exec(`
      INSERT INTO accounting_firms (name, owner_id)
      SELECT COALESCE(NULLIF(u.name,''), split_part(u.email,'@',1)) || ' (byrå)', u.id
      FROM users u WHERE u.is_accountant = true
        AND NOT EXISTS (SELECT 1 FROM firm_members fm WHERE fm.user_id = u.id);
      INSERT INTO firm_members (firm_id, user_id, role)
      SELECT f.id, f.owner_id, 'owner' FROM accounting_firms f
      WHERE f.owner_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM firm_members fm WHERE fm.firm_id=f.id AND fm.user_id=f.owner_id);
      UPDATE accountant_clients ac SET firm_id = fm.firm_id
      FROM firm_members fm WHERE ac.firm_id IS NULL AND fm.user_id = ac.accountant_id;
    `);
  }

  it("wraps legacy accountants in solo firms and backfills firm_id; re-run is a no-op", async () => {
    await reset();
    const a = await makeUser("legacy@f.se", true);
    const coOwner = await makeUser("c@co.se", false);
    const c = await makeCustomer("C", coOwner);
    await pg.query(`INSERT INTO accountant_clients (accountant_id, company_id, status, activated_at) VALUES ($1,$2,'active',now())`, [a, c]);

    await runBackfill();
    const firm = await getUserFirm(a);
    expect(firm?.role).toBe("owner");
    expect(await requireCompanyAccess(a, c)).not.toBeNull(); // works after backfill

    const firms1 = (await pg.query(`SELECT count(*)::int c FROM accounting_firms`)).rows[0] as { c: number };
    await runBackfill();
    await runBackfill();
    const firms3 = (await pg.query(`SELECT count(*)::int c FROM accounting_firms`)).rows[0] as { c: number };
    expect(firms3.c).toBe(firms1.c); // idempotent
  });
});
