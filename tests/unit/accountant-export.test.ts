import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Integration/security tests for the Accountant EXPORT flow (CSV + SIE + history)
 * against real Postgres (PGlite) with the actual migrations. Replicates the
 * route's authorization + scoping + history logic:
 *   requireAccountant → active relationship → CURRENT companyMembers →
 *   inArray(receipts.userId, memberIds) → build export → record accountantExports.
 */

let pg: PGlite;

async function reset() {
  await pg.exec(
    `TRUNCATE accountant_clients, accountant_exports, company_members, companies, receipts, users RESTART IDENTITY CASCADE;`,
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
async function addMember(companyId: string, userId: string) {
  await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'member')`, [companyId, userId]);
}
async function removeMember(companyId: string, userId: string) {
  await pg.query(`DELETE FROM company_members WHERE company_id=$1 AND user_id=$2`, [companyId, userId]);
}
async function relate(accountantId: string, companyId: string, status: string) {
  await pg.query(`INSERT INTO accountant_clients (accountant_id, company_id, status, activated_at) VALUES ($1,$2,$3,now())`, [accountantId, companyId, status]);
}
async function revoke(accountantId: string, companyId: string) {
  await pg.query(`UPDATE accountant_clients SET status='revoked' WHERE accountant_id=$1 AND company_id=$2`, [accountantId, companyId]);
}
async function makeReceipt(userId: string, vendor: string, companyId: string | null = null, date = "2026-03-10") {
  return (await pg.query<{ id: string }>(
    `INSERT INTO receipts (user_id, vendor_name, company_id, total_amount, vat_amount, vat_rate, date, status)
     VALUES ($1,$2,$3, 100.00, 20.00, 25, $4, 'approved') RETURNING id`,
    [userId, vendor, companyId, date],
  )).rows[0].id;
}

async function requireCompanyAccess(accountantId: string, companyId: string) {
  const rel = (await pg.query(`SELECT c.name FROM accountant_clients ac JOIN companies c ON c.id=ac.company_id WHERE ac.accountant_id=$1 AND ac.company_id=$2 AND ac.status='active' LIMIT 1`, [accountantId, companyId])).rows as Array<{ name: string }>;
  if (rel.length === 0) return null;
  const memberIds = (await pg.query<{ user_id: string }>(`SELECT user_id FROM company_members WHERE company_id=$1`, [companyId])).rows.map((m) => m.user_id);
  return { companyId, companyName: rel[0].name, memberIds };
}

/** Replicates the export POST: authorize → member-scoped rows → CSV → history. */
async function exportCsv(
  actor: { userId: string; isAccountant: boolean },
  companyId: string,
  opts: { from?: string; to?: string } = {},
) {
  if (!actor.isAccountant) return { status: 403 as const };
  const access = await requireCompanyAccess(actor.userId, companyId);
  if (!access) return { status: 404 as const };
  if (access.memberIds.length === 0) return { status: 404 as const };

  let sql = `SELECT date, vendor_name, bas_code, category, total_amount, vat_amount, vat_rate, status, id FROM receipts WHERE user_id = ANY($1)`;
  const params: unknown[] = [access.memberIds];
  if (opts.from) { params.push(opts.from); sql += ` AND date >= $${params.length}`; }
  if (opts.to) { params.push(opts.to + " 23:59:59"); sql += ` AND date <= $${params.length}`; }
  sql += ` ORDER BY date DESC`;
  const rows = (await pg.query(sql, params)).rows as Array<Record<string, unknown>>;

  const header = ["Datum", "Leverantör", "BAS-konto", "Kategori", "Belopp (SEK)", "Moms (SEK)", "Momssats (%)", "Status", "Kvitto-ID"];
  const lines = [header.join(";")];
  for (const r of rows) {
    lines.push([
      r.date ? new Date(r.date as string).toISOString().slice(0, 10) : "",
      r.vendor_name, r.bas_code, r.category, r.total_amount, r.vat_amount, r.vat_rate, r.status, r.id,
    ].map((v) => (v == null ? "" : String(v))).join(";"));
  }
  const csv = "\uFEFF" + lines.join("\r\n");

  await pg.query(
    `INSERT INTO accountant_exports (accountant_id, company_id, from_date, to_date, format, receipt_count) VALUES ($1,$2,$3,$4,'csv',$5)`,
    [actor.userId, access.companyId, opts.from ?? null, opts.to ?? null, rows.length],
  );
  return { status: 200 as const, csv, rowCount: rows.length, rows };
}

async function exportHistory(actor: { userId: string; isAccountant: boolean }, companyId: string) {
  if (!actor.isAccountant) return { status: 403 as const };
  const access = await requireCompanyAccess(actor.userId, companyId);
  if (!access) return { status: 404 as const };
  const rows = (await pg.query(
    `SELECT id, from_date, to_date, format, receipt_count, created_at FROM accountant_exports WHERE accountant_id=$1 AND company_id=$2 ORDER BY created_at DESC`,
    [actor.userId, access.companyId],
  )).rows;
  return { status: 200 as const, exports: rows };
}

beforeAll(async () => {
  pg = new PGlite();
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
});

describe("Accountant export — authorization & isolation", () => {
  it("accountant exports an active client's receipts", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    await makeReceipt(owner, "ICA");
    const res = await exportCsv({ userId: a, isAccountant: true }, company);
    expect(res.status).toBe(200);
    expect(res.rowCount).toBe(1);
  });

  it("non-accountant → 403", async () => {
    await reset();
    const u = await makeUser("u@co.se", false);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await makeReceipt(owner, "ICA");
    expect((await exportCsv({ userId: u, isAccountant: false }, company)).status).toBe(403);
  });

  it("pending relationship cannot export", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "pending");
    expect((await exportCsv({ userId: a, isAccountant: true }, company)).status).toBe(404);
  });

  it("revoked relationship immediately loses export access", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    await makeReceipt(owner, "ICA");
    expect((await exportCsv({ userId: a, isAccountant: true }, company)).status).toBe(200);
    await revoke(a, company);
    expect((await exportCsv({ userId: a, isAccountant: true }, company)).status).toBe(404);
  });

  it("accountant A cannot export accountant B's client (guessed id → 404)", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const b = await makeUser("b@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(b, company, "active");
    await makeReceipt(owner, "ICA");
    expect((await exportCsv({ userId: a, isAccountant: true }, company)).status).toBe(404);
  });
});

describe("Accountant export — member scoping & contents", () => {
  it("exports ONLY current members' receipts; company B's receipts never appear", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const ownerA = await makeUser("oa@co.se");
    const ownerB = await makeUser("ob@co.se");
    const compA = await makeCompany("A AB", ownerA);
    await makeCompany("B AB", ownerB);
    await relate(a, compA, "active");
    await makeReceipt(ownerA, "A-receipt");
    await makeReceipt(ownerB, "B-receipt");
    const res = await exportCsv({ userId: a, isAccountant: true }, compA);
    expect(res.csv).toContain("A-receipt");
    expect(res.csv).not.toContain("B-receipt");
    expect(res.rowCount).toBe(1);
  });

  it("misleading receipts.companyId does NOT get exported", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const ownerA = await makeUser("oa@co.se");
    const ownerB = await makeUser("ob@co.se");
    const compA = await makeCompany("A AB", ownerA);
    await relate(a, compA, "active");
    await makeReceipt(ownerB, "spoofed", compA); // stamped compA, owner not a member
    const res = await exportCsv({ userId: a, isAccountant: true }, compA);
    expect(res.csv).not.toContain("spoofed");
    expect(res.rowCount).toBe(0);
  });

  it("companyId = NULL still exported via current member ownership", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    await makeReceipt(owner, "null-co", null);
    const res = await exportCsv({ userId: a, isAccountant: true }, company);
    expect(res.csv).toContain("null-co");
  });

  it("removing a member drops their receipts from the export", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const member = await makeUser("m@co.se");
    const company = await makeCompany("Client AB", owner);
    await addMember(company, member);
    await relate(a, company, "active");
    await makeReceipt(member, "member-receipt");
    expect((await exportCsv({ userId: a, isAccountant: true }, company)).csv).toContain("member-receipt");
    await removeMember(company, member);
    const res = await exportCsv({ userId: a, isAccountant: true }, company);
    expect(res.csv).not.toContain("member-receipt");
    expect(res.rowCount).toBe(0);
  });

  it("date range filters exported receipts", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    await makeReceipt(owner, "Jan", null, "2026-01-15");
    await makeReceipt(owner, "Jun", null, "2026-06-15");
    const res = await exportCsv({ userId: a, isAccountant: true }, company, { from: "2026-05-01", to: "2026-12-31" });
    expect(res.csv).toContain("Jun");
    expect(res.csv).not.toContain("Jan");
    expect(res.rowCount).toBe(1);
  });

  it("CSV has the expected Swedish header", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    await makeReceipt(owner, "ICA");
    const res = await exportCsv({ userId: a, isAccountant: true }, company);
    expect(res.csv).toContain("Datum;Leverantör;BAS-konto;Kategori;Belopp (SEK);Moms (SEK);Momssats (%);Status;Kvitto-ID");
  });
});

describe("Accountant export — history", () => {
  it("each successful export is recorded, and history is scoped to this accountant+company", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    await makeReceipt(owner, "ICA");
    await exportCsv({ userId: a, isAccountant: true }, company, { from: "2026-01-01", to: "2026-12-31" });
    await exportCsv({ userId: a, isAccountant: true }, company);
    const hist = await exportHistory({ userId: a, isAccountant: true }, company);
    expect(hist.status).toBe(200);
    expect(hist.exports).toHaveLength(2);
    const first = hist.exports![0] as Record<string, unknown>;
    expect(first.format).toBe("csv");
    expect(Number(first.receipt_count)).toBe(1);
  });

  it("history for a client the accountant doesn't have → 404", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    // no relationship
    expect((await exportHistory({ userId: a, isAccountant: true }, company)).status).toBe(404);
  });

  it("accountant B cannot see accountant A's export history for the same company", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const b = await makeUser("b@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    await relate(b, company, "active"); // both connected to same company
    await makeReceipt(owner, "ICA");
    await exportCsv({ userId: a, isAccountant: true }, company); // A exports
    const bHist = await exportHistory({ userId: b, isAccountant: true }, company);
    expect(bHist.exports).toHaveLength(0); // B sees only its own (none)
  });
});
