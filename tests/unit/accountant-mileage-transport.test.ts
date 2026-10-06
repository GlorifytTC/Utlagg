import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Integration/security tests for the Accountant MILEAGE and PUBLIC-TRANSPORT
 * read APIs, against real Postgres (PGlite) with the actual migrations. They
 * exercise the exact authorization the routes perform:
 *   requireAccountant -> active relationship -> CURRENT companyMembers ->
 *   inArray(<table>.userId, memberIds)
 * so cross-company isolation, revocation, and non-member exclusion are verified
 * against real SQL, mirroring tests/unit/accountant-read.test.ts.
 */

let pg: PGlite;

async function reset() {
  await pg.exec(
    `TRUNCATE accountant_clients, company_members, companies, mileage_entries, transport_passes, users RESTART IDENTITY CASCADE;`,
  );
}
async function makeUser(email: string, isAccountant = false) {
  return (
    await pg.query<{ id: string }>(
      `INSERT INTO users (email, is_accountant, scan_limit) VALUES ($1,$2,25) RETURNING id`,
      [email.toLowerCase(), isAccountant],
    )
  ).rows[0].id;
}
async function makeCompany(name: string, ownerId: string) {
  const id = (await pg.query<{ id: string }>(`INSERT INTO companies (name) VALUES ($1) RETURNING id`, [name]))
    .rows[0].id;
  await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'owner')`, [id, ownerId]);
  return id;
}
async function addMember(companyId: string, userId: string) {
  await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'member')`, [companyId, userId]);
}
async function relate(accountantId: string, companyId: string, status: string) {
  await pg.query(
    `INSERT INTO accountant_clients (accountant_id, company_id, status, activated_at) VALUES ($1,$2,$3, now())`,
    [accountantId, companyId, status],
  );
}
async function revoke(accountantId: string, companyId: string) {
  await pg.query(
    `UPDATE accountant_clients SET status='revoked', revoked_at=now() WHERE accountant_id=$1 AND company_id=$2`,
    [accountantId, companyId],
  );
}
async function makeMileage(userId: string, amount = 25.0) {
  return (
    await pg.query<{ id: string }>(
      `INSERT INTO mileage_entries (user_id, start_address, end_address, distance_km, rate_per_km, amount, date)
       VALUES ($1,'Hem','Kontor',10,2.50,$2, now()) RETURNING id`,
      [userId, amount],
    )
  ).rows[0].id;
}
async function makeTransport(userId: string, amount = 1000.0) {
  return (
    await pg.query<{ id: string }>(
      `INSERT INTO transport_passes (user_id, amount, valid_from, valid_to)
       VALUES ($1,$2, now(), now() + interval '30 days') RETURNING id`,
      [userId, amount],
    )
  ).rows[0].id;
}

/** Replicates lib/accountant.requireCompanyAccess: active-only + current members. */
async function requireCompanyAccess(accountantId: string, companyId: string) {
  const rel = (
    await pg.query(
      `SELECT 1 FROM accountant_clients WHERE accountant_id=$1 AND company_id=$2 AND status='active' LIMIT 1`,
      [accountantId, companyId],
    )
  ).rows;
  if (rel.length === 0) return null;
  const members = (
    await pg.query<{ user_id: string }>(`SELECT user_id FROM company_members WHERE company_id=$1`, [companyId])
  ).rows.map((m) => m.user_id);
  return { companyId, memberIds: members };
}

async function listMileage(accountantId: string, companyId: string) {
  const access = await requireCompanyAccess(accountantId, companyId);
  if (!access) return { status: 404 as const };
  if (access.memberIds.length === 0) return { status: 200 as const, ids: [] };
  const ids = (
    await pg.query<{ id: string }>(`SELECT id FROM mileage_entries WHERE user_id = ANY($1)`, [access.memberIds])
  ).rows.map((r) => r.id);
  return { status: 200 as const, ids };
}
async function listTransport(accountantId: string, companyId: string) {
  const access = await requireCompanyAccess(accountantId, companyId);
  if (!access) return { status: 404 as const };
  if (access.memberIds.length === 0) return { status: 200 as const, ids: [] };
  const ids = (
    await pg.query<{ id: string }>(`SELECT id FROM transport_passes WHERE user_id = ANY($1)`, [access.memberIds])
  ).rows.map((r) => r.id);
  return { status: 200 as const, ids };
}

beforeAll(async () => {
  pg = new PGlite();
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
});

describe("Accountant mileage + transport read APIs - authorization", () => {
  it("returns the client's mileage and transport for an active relationship (owner + members)", async () => {
    await reset();
    const acct = await makeUser("acct@firm.se", true);
    const owner = await makeUser("owner@co.se");
    const emp = await makeUser("emp@co.se");
    const co = await makeCompany("Client AB", owner);
    await addMember(co, emp);
    await relate(acct, co, "active");
    const m1 = await makeMileage(owner);
    const m2 = await makeMileage(emp);
    const t1 = await makeTransport(owner);

    const mil = await listMileage(acct, co);
    const tr = await listTransport(acct, co);
    expect(mil.status).toBe(200);
    expect(mil.ids!.sort()).toEqual([m1, m2].sort());
    expect(tr.ids).toEqual([t1]);
  });

  it("excludes entries owned by a non-member (not scoped by companyId)", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const outsider = await makeUser("outsider@x.se"); // never a member
    const co = await makeCompany("Co AB", owner);
    await relate(acct, co, "active");
    await makeMileage(owner);
    const outsiderMileage = await makeMileage(outsider);
    const outsiderPass = await makeTransport(outsider);

    const mil = await listMileage(acct, co);
    const tr = await listTransport(acct, co);
    expect(mil.ids).not.toContain(outsiderMileage);
    expect(tr.ids).not.toContain(outsiderPass);
  });

  it("isolates companies: accountant of company A cannot see company B's data", async () => {
    await reset();
    const acctA = await makeUser("accta@firm.se", true);
    const ownerA = await makeUser("oa@co.se");
    const ownerB = await makeUser("ob@co.se");
    const coA = await makeCompany("A AB", ownerA);
    const coB = await makeCompany("B AB", ownerB);
    await relate(acctA, coA, "active");
    await makeMileage(ownerB);
    await makeTransport(ownerB);

    // acctA has no relationship to coB -> 404, and coA has no mileage of its own.
    expect((await listMileage(acctA, coB)).status).toBe(404);
    expect((await listTransport(acctA, coB)).status).toBe(404);
    expect((await listMileage(acctA, coA)).ids).toEqual([]);
  });

  it("revoked relationship loses access to both datasets", async () => {
    await reset();
    const acct = await makeUser("a2@firm.se", true);
    const owner = await makeUser("o2@co.se");
    const co = await makeCompany("Co2 AB", owner);
    await relate(acct, co, "active");
    await makeMileage(owner);
    await makeTransport(owner);
    expect((await listMileage(acct, co)).status).toBe(200);

    await revoke(acct, co);
    expect((await listMileage(acct, co)).status).toBe(404);
    expect((await listTransport(acct, co)).status).toBe(404);
  });

  it("pending relationship grants no access", async () => {
    await reset();
    const acct = await makeUser("a3@firm.se", true);
    const owner = await makeUser("o3@co.se");
    const co = await makeCompany("Co3 AB", owner);
    await relate(acct, co, "pending");
    await makeMileage(owner);
    await makeTransport(owner);
    expect((await listMileage(acct, co)).status).toBe(404);
    expect((await listTransport(acct, co)).status).toBe(404);
  });
});
