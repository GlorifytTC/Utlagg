import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Integration/security tests for the Accountant CLIENTS READ APIs, run against
 * a real Postgres (PGlite) with the actual migrations. They exercise the exact
 * authorization + query logic the routes perform:
 *   requireAccountant → active relationship → CURRENT companyMembers →
 *   inArray(receipts.userId, memberIds)
 * so cross-company isolation, revocation, and companyId-manipulation
 * resistance are verified against real SQL, not mocks.
 */

let pg: PGlite;

async function reset() {
  await pg.exec(
    `TRUNCATE accountant_clients, company_members, companies, receipts, users RESTART IDENTITY CASCADE;`,
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
  const id = (
    await pg.query<{ id: string }>(`INSERT INTO companies (name) VALUES ($1) RETURNING id`, [name])
  ).rows[0].id;
  await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'owner')`, [
    id,
    ownerId,
  ]);
  return id;
}
async function addMember(companyId: string, userId: string) {
  await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'member')`, [
    companyId,
    userId,
  ]);
}
async function removeMember(companyId: string, userId: string) {
  await pg.query(`DELETE FROM company_members WHERE company_id=$1 AND user_id=$2`, [companyId, userId]);
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
async function makeReceipt(userId: string, vendor: string, companyId: string | null = null) {
  return (
    await pg.query<{ id: string }>(
      `INSERT INTO receipts (user_id, vendor_name, company_id, total_amount, date, status)
       VALUES ($1,$2,$3, 100.00, now(), 'approved') RETURNING id`,
      [userId, vendor, companyId],
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
    await pg.query<{ user_id: string }>(`SELECT user_id FROM company_members WHERE company_id=$1`, [
      companyId,
    ])
  ).rows.map((m) => m.user_id);
  return { companyId, memberIds: members };
}

/** Replicates the receipts-list route: 404 if no access, else member-scoped. */
async function listReceipts(
  accountantId: string,
  companyId: string,
  opts: { q?: string; from?: string; to?: string; sort?: string; dir?: string; page?: number; pageSize?: number } = {},
) {
  const access = await requireCompanyAccess(accountantId, companyId);
  if (!access) return { status: 404 as const };
  if (access.memberIds.length === 0) return { status: 200 as const, rows: [], total: 0 };

  const params: unknown[] = [access.memberIds];
  let sql = `SELECT id, vendor_name, date, total_amount FROM receipts WHERE user_id = ANY($1)`;
  if (opts.q) {
    params.push(`%${opts.q}%`);
    sql += ` AND vendor_name ILIKE $${params.length}`;
  }
  if (opts.from) {
    params.push(opts.from);
    sql += ` AND date >= $${params.length}`;
  }
  if (opts.to) {
    params.push(opts.to);
    sql += ` AND date <= $${params.length}`;
  }
  const sortCol = { date: "date", vendor: "vendor_name", amount: "total_amount" }[opts.sort ?? "date"] ?? "date";
  const dir = opts.dir === "asc" ? "asc" : "desc";
  sql += ` ORDER BY ${sortCol} ${dir} NULLS LAST, created_at DESC`;
  const pageSize = opts.pageSize ?? 25;
  const page = opts.page ?? 1;
  sql += ` LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;
  const rows = (await pg.query(sql, params)).rows as Array<{ id: string; vendor_name: string }>;
  return { status: 200 as const, rows, total: rows.length };
}

/** Replicates the single-receipt route: 404 unless owner is a current member. */
async function getReceipt(accountantId: string, companyId: string, receiptId: string) {
  const access = await requireCompanyAccess(accountantId, companyId);
  if (!access || access.memberIds.length === 0) return { status: 404 as const };
  const row = (
    await pg.query(`SELECT id FROM receipts WHERE id=$1 AND user_id = ANY($2) LIMIT 1`, [
      receiptId,
      access.memberIds,
    ])
  ).rows;
  return row.length ? { status: 200 as const, id: (row[0] as { id: string }).id } : { status: 404 as const };
}

/** Replicates the clients-list route: active-only for this accountant. */
async function listClients(accountantId: string) {
  return (
    await pg.query<{ company_id: string }>(
      `SELECT company_id FROM accountant_clients WHERE accountant_id=$1 AND status='active'`,
      [accountantId],
    )
  ).rows.map((r) => r.company_id);
}

beforeAll(async () => {
  pg = new PGlite();
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
});

describe("Accountant read APIs — client authorization", () => {
  it("lists only ACTIVE clients; pending and revoked are excluded", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    const o1 = await makeUser("c1@co.se");
    const o2 = await makeUser("c2@co.se");
    const o3 = await makeUser("c3@co.se");
    const active = await makeCompany("Active AB", o1);
    const pending = await makeCompany("Pending AB", o2);
    const revoked = await makeCompany("Revoked AB", o3);
    await relate(acct, active, "active");
    await relate(acct, pending, "pending");
    await relate(acct, revoked, "revoked");
    const clients = await listClients(acct);
    expect(clients).toEqual([active]);
  });

  it("accountant A cannot access accountant B's client (detail → 404)", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const b = await makeUser("b@firm.se", true);
    const owner = await makeUser("c@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(b, company, "active"); // belongs to B only
    // A tries to access B's client by knowing the company id
    expect(await requireCompanyAccess(a, company)).toBeNull();
  });

  it("pending relationship has zero access", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("c@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "pending");
    expect(await requireCompanyAccess(a, company)).toBeNull();
  });

  it("revocation takes effect immediately", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("c@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    expect(await requireCompanyAccess(a, company)).not.toBeNull();
    await revoke(a, company);
    expect(await requireCompanyAccess(a, company)).toBeNull();
  });

  it("unauthorized company detail returns 404 (indistinguishable from unknown)", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("c@co.se");
    const company = await makeCompany("Client AB", owner);
    // no relationship
    const res = await listReceipts(a, company);
    expect(res.status).toBe(404);
  });
});

describe("Accountant read APIs — receipt isolation", () => {
  it("reads receipts for an active client, scoped to current members", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("owner@co.se");
    const member = await makeUser("member@co.se");
    const company = await makeCompany("Client AB", owner);
    await addMember(company, member);
    await relate(a, company, "active");
    await makeReceipt(owner, "ICA");
    await makeReceipt(member, "Coop");
    const res = await listReceipts(a, company);
    expect(res.status).toBe(200);
    expect(res.rows?.map((r) => r.vendor_name).sort()).toEqual(["Coop", "ICA"]);
  });

  it("company A cannot see company B's receipts", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const ownerA = await makeUser("ownerA@co.se");
    const ownerB = await makeUser("ownerB@co.se");
    const compA = await makeCompany("A AB", ownerA);
    const compB = await makeCompany("B AB", ownerB);
    await relate(a, compA, "active"); // A's accountant only for compA
    await makeReceipt(ownerA, "A-receipt");
    await makeReceipt(ownerB, "B-receipt");
    const res = await listReceipts(a, compA);
    expect(res.rows?.map((r) => r.vendor_name)).toEqual(["A-receipt"]);
    expect(res.rows?.some((r) => r.vendor_name === "B-receipt")).toBe(false);
  });

  it("receipt-ID swap cannot cross the company boundary (404)", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const ownerA = await makeUser("ownerA@co.se");
    const ownerB = await makeUser("ownerB@co.se");
    const compA = await makeCompany("A AB", ownerA);
    await makeCompany("B AB", ownerB);
    await relate(a, compA, "active");
    const foreignReceipt = await makeReceipt(ownerB, "B-secret"); // belongs to B
    // Accountant authorized for compA tries to fetch B's receipt id
    const res = await getReceipt(a, compA, foreignReceipt);
    expect(res.status).toBe(404);
  });

  it("misleading receipts.companyId does NOT grant access", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const ownerA = await makeUser("ownerA@co.se");
    const ownerB = await makeUser("ownerB@co.se");
    const compA = await makeCompany("A AB", ownerA);
    await relate(a, compA, "active");
    // B's receipt is stamped with compA's id (manipulated), but its OWNER is not
    // a member of compA — must not appear.
    const spoofed = await makeReceipt(ownerB, "spoofed", compA);
    const res = await listReceipts(a, compA);
    expect(res.rows?.some((r) => r.vendor_name === "spoofed")).toBe(false);
    expect((await getReceipt(a, compA, spoofed)).status).toBe(404);
  });

  it("receipts.companyId = NULL does not break legitimate member-based access", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("owner@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    await makeReceipt(owner, "null-company", null); // companyId NULL, owner is a member
    const res = await listReceipts(a, company);
    expect(res.rows?.map((r) => r.vendor_name)).toEqual(["null-company"]);
  });

  it("removing a current member makes their receipts inaccessible", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("owner@co.se");
    const member = await makeUser("member@co.se");
    const company = await makeCompany("Client AB", owner);
    await addMember(company, member);
    await relate(a, company, "active");
    const memberReceipt = await makeReceipt(member, "member-receipt");
    // visible while member
    expect((await getReceipt(a, company, memberReceipt)).status).toBe(200);
    // remove the member → their receipts drop out immediately
    await removeMember(company, member);
    expect((await getReceipt(a, company, memberReceipt)).status).toBe(404);
    const res = await listReceipts(a, company);
    expect(res.rows?.some((r) => r.vendor_name === "member-receipt")).toBe(false);
  });

  it("unauthorized receipt detail returns 404 (not 403)", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const ownerB = await makeUser("ownerB@co.se");
    const compB = await makeCompany("B AB", ownerB);
    const compA = await makeCompany("A AB", await makeUser("ownerA@co.se"));
    await relate(a, compA, "active");
    const bReceipt = await makeReceipt(ownerB, "b");
    // request against a company the accountant DOES have, but a receipt from B
    const res = await getReceipt(a, compA, bReceipt);
    expect(res.status).toBe(404);
    void compB;
  });
});

describe("Accountant read APIs — query behavior", () => {
  it("search, date filter, sort, and pagination work on scoped receipts", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("owner@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    await pg.query(
      `INSERT INTO receipts (user_id, vendor_name, total_amount, date, status) VALUES
        ($1,'Alfa',10,'2026-01-10','approved'),
        ($1,'Beta',20,'2026-03-10','approved'),
        ($1,'Gamma',30,'2026-06-10','approved')`,
      [owner],
    );
    // search
    const s = await listReceipts(a, company, { q: "Bet" });
    expect(s.rows?.map((r) => r.vendor_name)).toEqual(["Beta"]);
    // date filter (only March+)
    const d = await listReceipts(a, company, { from: "2026-02-01", to: "2026-12-31" });
    expect(d.rows?.map((r) => r.vendor_name).sort()).toEqual(["Beta", "Gamma"]);
    // sort by vendor asc
    const so = await listReceipts(a, company, { sort: "vendor", dir: "asc" });
    expect(so.rows?.map((r) => r.vendor_name)).toEqual(["Alfa", "Beta", "Gamma"]);
    // pagination
    const p1 = await listReceipts(a, company, { pageSize: 2, page: 1, sort: "vendor", dir: "asc" });
    const p2 = await listReceipts(a, company, { pageSize: 2, page: 2, sort: "vendor", dir: "asc" });
    expect(p1.rows?.length).toBe(2);
    expect(p2.rows?.length).toBe(1);
  });
});
