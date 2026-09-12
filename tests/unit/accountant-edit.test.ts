import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Integration/security tests for the Accountant RECEIPT EDIT + REVIEW PATCH.
 * Runs against real Postgres (PGlite) with the actual migrations. Replicates
 * the route's authorization + update logic exactly:
 *   requireAccountant → active relationship → CURRENT companyMembers →
 *   scope by inArray(userId, memberIds) → whitelist update → diff-audit.
 */

let pg: PGlite;

async function reset() {
  await pg.exec(
    `TRUNCATE accountant_clients, company_members, companies, receipts, audit_logs, users RESTART IDENTITY CASCADE;`,
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
  await pg.query(
    `INSERT INTO accountant_clients (accountant_id, company_id, status, activated_at) VALUES ($1,$2,$3, now())`,
    [accountantId, companyId, status],
  );
}
async function revoke(accountantId: string, companyId: string) {
  await pg.query(`UPDATE accountant_clients SET status='revoked' WHERE accountant_id=$1 AND company_id=$2`, [accountantId, companyId]);
}
async function makeReceipt(userId: string, vendor: string, companyId: string | null = null) {
  return (
    await pg.query<{ id: string }>(
      `INSERT INTO receipts (user_id, vendor_name, company_id, total_amount, vat_rate, date, status)
       VALUES ($1,$2,$3, 100.00, 25, now(), 'approved') RETURNING id`,
      [userId, vendor, companyId],
    )
  ).rows[0].id;
}

async function requireCompanyAccess(accountantId: string, companyId: string) {
  const rel = (
    await pg.query(`SELECT 1 FROM accountant_clients WHERE accountant_id=$1 AND company_id=$2 AND status='active' LIMIT 1`, [accountantId, companyId])
  ).rows;
  if (rel.length === 0) return null;
  const memberIds = (
    await pg.query<{ user_id: string }>(`SELECT user_id FROM company_members WHERE company_id=$1`, [companyId])
  ).rows.map((m) => m.user_id);
  return { companyId, memberIds };
}

const WHITELIST = new Set(["category", "vatAmount", "vatRate", "basCode", "vendorName", "note", "reviewed"]);

/** Replicates the PATCH route: whitelist + member-scope + diff + audit. */
async function patchReceipt(
  actor: { userId: string; isAccountant: boolean },
  companyId: string,
  receiptId: string,
  body: Record<string, unknown>,
) {
  if (!actor.isAccountant) return { status: 403 as const };
  const access = await requireCompanyAccess(actor.userId, companyId);
  if (!access || access.memberIds.length === 0) return { status: 404 as const };

  // .strict(): reject unknown keys
  for (const k of Object.keys(body)) if (!WHITELIST.has(k)) return { status: 400 as const, reason: "unknown-key" };

  const current = (
    await pg.query(`SELECT * FROM receipts WHERE id=$1 AND user_id = ANY($2) LIMIT 1`, [receiptId, access.memberIds])
  ).rows[0] as Record<string, unknown> | undefined;
  if (!current) return { status: 404 as const };

  const set: Record<string, unknown> = {};
  if ("category" in body) set.category = body.category ?? null;
  if ("vatAmount" in body) set.vat_amount = body.vatAmount == null ? null : Number(body.vatAmount).toFixed(2);
  if ("vatRate" in body) set.vat_rate = body.vatRate ?? null;
  if ("basCode" in body) set.bas_code = body.basCode ?? null;
  if ("vendorName" in body) set.vendor_name = body.vendorName ?? null;
  if ("note" in body) set.note = body.note ?? null;
  if (body.reviewed === true) {
    set.reviewed_at = new Date();
    set.reviewed_by = actor.userId; // server-derived
  } else if (body.reviewed === false) {
    set.reviewed_at = null;
    set.reviewed_by = null;
  }

  // diff
  const oldV: Record<string, unknown> = {};
  const newV: Record<string, unknown> = {};
  for (const [k, next] of Object.entries(set)) {
    const prev = current[k];
    const pn = prev instanceof Date ? prev.toISOString() : (prev ?? null);
    const nn = next instanceof Date ? next.toISOString() : (next ?? null);
    if (String(pn) !== String(nn)) { oldV[k] = pn; newV[k] = nn; }
  }
  if (Object.keys(newV).length === 0) return { status: 200 as const, changed: false, receiptId };

  const cols = Object.keys(set);
  const assigns = cols.map((c, i) => `${c}=$${i + 3}`).join(", ");
  const vals = cols.map((c) => (set[c] instanceof Date ? (set[c] as Date).toISOString() : set[c]));
  await pg.query(
    `UPDATE receipts SET ${assigns} WHERE id=$1 AND user_id = ANY($2)`,
    [receiptId, access.memberIds, ...vals],
  );
  await pg.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
     VALUES ($1,'accountant.receipt.update','receipt',$2,$3,$4)`,
    [actor.userId, receiptId, JSON.stringify(oldV), JSON.stringify(newV)],
  );
  return { status: 200 as const, changed: true, receiptId, oldV, newV };
}

async function getReceiptRow(id: string) {
  return (await pg.query(`SELECT * FROM receipts WHERE id=$1`, [id])).rows[0] as Record<string, unknown>;
}
async function auditCount(receiptId: string) {
  return (await pg.query(`SELECT * FROM audit_logs WHERE entity_id=$1 AND action='accountant.receipt.update'`, [receiptId])).rows;
}

beforeAll(async () => {
  pg = new PGlite();
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
});

describe("Accountant receipt edit — authorization", () => {
  it("accountant can edit an active client's receipt", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    const rid = await makeReceipt(owner, "ICA");
    const res = await patchReceipt({ userId: a, isAccountant: true }, company, rid, { category: "Food" });
    expect(res.status).toBe(200);
    expect((await getReceiptRow(rid)).category).toBe("Food");
  });

  it("non-accountant → 403", async () => {
    await reset();
    const u = await makeUser("u@co.se", false);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    const rid = await makeReceipt(owner, "ICA");
    expect((await patchReceipt({ userId: u, isAccountant: false }, company, rid, { category: "X" })).status).toBe(403);
  });

  it("pending relationship cannot edit", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "pending");
    const rid = await makeReceipt(owner, "ICA");
    expect((await patchReceipt({ userId: a, isAccountant: true }, company, rid, { category: "X" })).status).toBe(404);
  });

  it("revoked relationship immediately loses edit access", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    const rid = await makeReceipt(owner, "ICA");
    expect((await patchReceipt({ userId: a, isAccountant: true }, company, rid, { category: "X" })).status).toBe(200);
    await revoke(a, company);
    expect((await patchReceipt({ userId: a, isAccountant: true }, company, rid, { category: "Y" })).status).toBe(404);
  });

  it("accountant A cannot edit accountant B's client (guessed company id)", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const b = await makeUser("b@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(b, company, "active");
    const rid = await makeReceipt(owner, "ICA");
    expect((await patchReceipt({ userId: a, isAccountant: true }, company, rid, { category: "X" })).status).toBe(404);
  });

  it("receipt-ID swap cannot cross company boundary (404)", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const ownerA = await makeUser("oa@co.se");
    const ownerB = await makeUser("ob@co.se");
    const compA = await makeCompany("A", ownerA);
    await makeCompany("B", ownerB);
    await relate(a, compA, "active");
    const foreign = await makeReceipt(ownerB, "B-secret");
    expect((await patchReceipt({ userId: a, isAccountant: true }, compA, foreign, { category: "X" })).status).toBe(404);
  });
});

describe("Accountant receipt edit — member scoping", () => {
  it("misleading receipts.companyId does not grant edit access", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const ownerA = await makeUser("oa@co.se");
    const ownerB = await makeUser("ob@co.se");
    const compA = await makeCompany("A", ownerA);
    await relate(a, compA, "active");
    const spoof = await makeReceipt(ownerB, "spoof", compA); // stamped compA, owner not a member
    expect((await patchReceipt({ userId: a, isAccountant: true }, compA, spoof, { category: "X" })).status).toBe(404);
  });

  it("companyId = NULL still authorized via current member ownership", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    const rid = await makeReceipt(owner, "null-co", null);
    expect((await patchReceipt({ userId: a, isAccountant: true }, company, rid, { category: "OK" })).status).toBe(200);
  });

  it("removing the owner from members immediately removes edit access", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const member = await makeUser("m@co.se");
    const company = await makeCompany("Client AB", owner);
    await addMember(company, member);
    await relate(a, company, "active");
    const rid = await makeReceipt(member, "m-receipt");
    expect((await patchReceipt({ userId: a, isAccountant: true }, company, rid, { category: "X" })).status).toBe(200);
    await removeMember(company, member);
    expect((await patchReceipt({ userId: a, isAccountant: true }, company, rid, { category: "Y" })).status).toBe(404);
  });

  it("adding a member makes their receipts editable", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const late = await makeUser("late@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    const rid = await makeReceipt(late, "late-receipt");
    expect((await patchReceipt({ userId: a, isAccountant: true }, company, rid, { category: "X" })).status).toBe(404);
    await addMember(company, late);
    expect((await patchReceipt({ userId: a, isAccountant: true }, company, rid, { category: "OK" })).status).toBe(200);
  });
});

describe("Accountant receipt edit — field whitelist", () => {
  it("allows category/vatAmount/vatRate/basCode/vendorName/note", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    const rid = await makeReceipt(owner, "ICA");
    await patchReceipt({ userId: a, isAccountant: true }, company, rid, {
      category: "Food", vatAmount: 12.5, vatRate: 12, basCode: "5811", vendorName: "ICA Maxi", note: "checked",
    });
    const row = await getReceiptRow(rid);
    expect(row.category).toBe("Food");
    expect(String(row.vat_amount)).toBe("12.50");
    expect(row.vat_rate).toBe(12);
    expect(row.bas_code).toBe("5811");
    expect(row.vendor_name).toBe("ICA Maxi");
    expect(row.note).toBe("checked");
  });

  it("rejects protected fields as unknown keys (userId/companyId/status/totalAmount/date/approvedBy)", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    const rid = await makeReceipt(owner, "ICA");
    for (const bad of [
      { userId: "x" }, { companyId: "x" }, { status: "approved" }, { totalAmount: 9999 },
      { date: "2020-01-01" }, { approvedBy: "x" }, { imageUrl: "x" }, { receiptText: "x" }, { id: "x" },
    ]) {
      const res = await patchReceipt({ userId: a, isAccountant: true }, company, rid, bad);
      expect(res.status).toBe(400);
    }
    // none of the protected fields changed
    const row = await getReceiptRow(rid);
    expect(String(row.total_amount)).toBe("100.00");
    expect(row.status).toBe("approved");
    expect(row.user_id).toBe(owner);
  });
});

describe("Accountant receipt edit — reviewer integrity", () => {
  it("reviewedBy is server-derived; a foreign reviewedBy is rejected as unknown key", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const impostor = await makeUser("evil@x.se");
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    const rid = await makeReceipt(owner, "ICA");
    // supplying reviewedBy directly → unknown key → 400
    expect((await patchReceipt({ userId: a, isAccountant: true }, company, rid, { reviewedBy: impostor })).status).toBe(400);
    // proper review action → reviewedBy = the accountant, reviewedAt set
    const res = await patchReceipt({ userId: a, isAccountant: true }, company, rid, { reviewed: true });
    expect(res.status).toBe(200);
    const row = await getReceiptRow(rid);
    expect(row.reviewed_by).toBe(a);
    expect(row.reviewed_at).not.toBeNull();
  });

  it("clearing review sets reviewedBy/At to null (no arbitrary id)", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    const rid = await makeReceipt(owner, "ICA");
    await patchReceipt({ userId: a, isAccountant: true }, company, rid, { reviewed: true });
    await patchReceipt({ userId: a, isAccountant: true }, company, rid, { reviewed: false });
    const row = await getReceiptRow(rid);
    expect(row.reviewed_by).toBeNull();
    expect(row.reviewed_at).toBeNull();
  });
});

describe("Accountant receipt edit — audit", () => {
  it("successful mutation creates exactly one audit event with correct old/new values", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    const rid = await makeReceipt(owner, "ICA"); // category starts null
    await patchReceipt({ userId: a, isAccountant: true }, company, rid, { category: "Food" });
    const events = await auditCount(rid);
    expect(events).toHaveLength(1);
    const e = events[0] as Record<string, unknown>;
    expect(e.old_values).toMatchObject({ category: null });
    expect(e.new_values).toMatchObject({ category: "Food" });
    expect(e.user_id).toBe(a);
  });

  it("no-op update creates NO audit event and reports changed:false", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    const rid = await makeReceipt(owner, "ICA");
    await patchReceipt({ userId: a, isAccountant: true }, company, rid, { vatRate: 25 }); // already 25
    const res = await patchReceipt({ userId: a, isAccountant: true }, company, rid, { vatRate: 25 });
    expect(res.status).toBe(200);
    expect((res as { changed?: boolean }).changed).toBe(false);
    expect(await auditCount(rid)).toHaveLength(0);
  });

  it("only changed fields are recorded, not untouched ones", async () => {
    await reset();
    const a = await makeUser("a@firm.se", true);
    const owner = await makeUser("o@co.se");
    const company = await makeCompany("Client AB", owner);
    await relate(a, company, "active");
    const rid = await makeReceipt(owner, "ICA"); // vat_rate=25 already
    // send vendorName change + vatRate unchanged(25) → only vendorName recorded
    await patchReceipt({ userId: a, isAccountant: true }, company, rid, { vendorName: "New Name", vatRate: 25 });
    const e = (await auditCount(rid))[0] as Record<string, unknown>;
    expect(e.new_values).toMatchObject({ vendor_name: "New Name" });
    expect(e.new_values).not.toHaveProperty("vat_rate");
  });
});
