import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { NextRequest } from "next/server";
import * as schema from "@/db/schema";

/**
 * Calls the REAL admin add-member route and the REAL training-stats function,
 * with `@/db` pointed at PGlite running the actual migrations.
 */

const pg = new PGlite();
const testDb = drizzle(pg, { schema });
let adminSession: { user: { id: string; email: string } } | null = null;
const sendInvite = vi.fn(async () => true);

vi.mock("@/db", () => ({ db: testDb }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin", () => ({ requireAdmin: async () => adminSession }));
vi.mock("@/lib/email", () => ({ sendCompanyInviteEmail: (...a: unknown[]) => sendInvite(...(a as [])) }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logAuditEvent: vi.fn(), clientIp: () => null }));

const { POST: addMember } = await import("@/app/api/admin/companies/[id]/members/route");
const { getTrainingStats } = await import("@/lib/admin-training");

const req = (body: unknown) =>
  new NextRequest("http://test.local/api", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
async function one<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return (await pg.query<T>(sql, params)).rows[0];
}
async function makeUser(email: string, opts: { accountant?: boolean; password?: boolean } = {}) {
  return (await one<{ id: string }>(
    `INSERT INTO users (email, scan_limit, is_accountant, hashed_password) VALUES ($1, 25, $2, $3) RETURNING id`,
    [email, !!opts.accountant, opts.password === false ? null : "x"],
  ))!.id;
}
async function makeCompany(name: string, ownerId: string) {
  const { id } = (await one<{ id: string }>(`INSERT INTO companies (name) VALUES ($1) RETURNING id`, [name]))!;
  await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'owner')`, [id, ownerId]);
  return id;
}
const body = (email: string, role = "member") => ({ email, firstName: "Anna", lastName: "Svensson", role });

beforeAll(async () => {
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
});

beforeEach(async () => {
  await pg.exec(
    `TRUNCATE company_invites, company_members, companies, receipt_training_data, vendor_corrections, ocr_samples, users RESTART IDENTITY CASCADE;`,
  );
  sendInvite.mockClear();
  const adminId = await makeUser("admin@kvittino.se");
  adminSession = { user: { id: adminId, email: "admin@kvittino.se" } };
});

describe("POST /api/admin/companies/[id]/members", () => {
  it("rejects non-admins with 403 and changes nothing", async () => {
    const co = await makeCompany("Co AB", await makeUser("owner@co.se"));
    adminSession = null;
    const res = await addMember(req(body("new@co.se")), { params: { id: co } });
    expect(res.status).toBe(403);
    expect(await one(`SELECT id FROM users WHERE email='new@co.se'`)).toBeUndefined();
  });

  it("adds an existing user without a company directly, with the chosen role", async () => {
    const co = await makeCompany("Co AB", await makeUser("owner@co.se"));
    const u = await makeUser("worker@co.se");
    const res = await addMember(req(body("Worker@Co.se", "admin")), { params: { id: co } });
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("added");
    const row = await one<{ role: string }>(`SELECT role FROM company_members WHERE user_id=$1 AND company_id=$2`, [u, co]);
    expect(row?.role).toBe("admin");
    expect(sendInvite).not.toHaveBeenCalled();
  });

  it("invites a brand-new email: pre-creates a passwordless account and an invite with the role", async () => {
    const co = await makeCompany("Co AB", await makeUser("owner@co.se"));
    const res = await addMember(req(body("fresh@co.se", "member")), { params: { id: co } });
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("invited");
    const u = await one<{ hashed_password: string | null; name: string }>(
      `SELECT hashed_password, name FROM users WHERE email='fresh@co.se'`,
    );
    expect(u?.hashed_password).toBeNull();
    expect(u?.name).toBe("Anna Svensson");
    const inv = await one<{ role: string; company_id: string }>(
      `SELECT role, company_id FROM company_invites WHERE email='fresh@co.se'`,
    );
    expect(inv).toEqual({ role: "member", company_id: co });
    expect(sendInvite).toHaveBeenCalledTimes(1);
    // Not a member until they accept the invite.
    expect(await one(`SELECT 1 FROM company_members WHERE company_id=$1 AND role='member'`, [co])).toBeUndefined();
  });

  it("409 when the user is already in this company", async () => {
    const owner = await makeUser("owner@co.se");
    const co = await makeCompany("Co AB", owner);
    const res = await addMember(req(body("owner@co.se")), { params: { id: co } });
    expect(res.status).toBe(409);
  });

  it("409 when the user already belongs to another company (one company per user)", async () => {
    const coA = await makeCompany("A AB", await makeUser("a@a.se"));
    const coB = await makeCompany("B AB", await makeUser("b@b.se"));
    const res = await addMember(req(body("a@a.se")), { params: { id: coB } });
    expect(res.status).toBe(409);
    const row = await one<{ company_id: string }>(
      `SELECT company_id FROM company_members m JOIN users u ON u.id=m.user_id WHERE u.email='a@a.se'`,
    );
    expect(row?.company_id).toBe(coA);
  });

  it("409 for accountant accounts", async () => {
    const co = await makeCompany("Co AB", await makeUser("owner@co.se"));
    await makeUser("rev@firm.se", { accountant: true });
    const res = await addMember(req(body("rev@firm.se")), { params: { id: co } });
    expect(res.status).toBe(409);
  });

  it("never assigns owner, rejects bad input, 404 for unknown company", async () => {
    const co = await makeCompany("Co AB", await makeUser("owner@co.se"));
    expect((await addMember(req(body("x@co.se", "owner")), { params: { id: co } })).status).toBe(400);
    expect((await addMember(req({ email: "nope" }), { params: { id: co } })).status).toBe(400);
    expect(
      (await addMember(req(body("y@co.se")), { params: { id: "00000000-0000-0000-0000-000000000000" } })).status,
    ).toBe(404);
  });
});

describe("getTrainingStats", () => {
  async function sample(ai: Record<string, unknown>, confirmed: Record<string, unknown> | null, corrected = false) {
    await pg.query(
      `INSERT INTO receipt_training_data (ai_result, source, image_data, confirmed_vendor, confirmed_org_number,
         confirmed_date, confirmed_total, confirmed_vat, confirmed_vat_rate, was_corrected)
       VALUES ($1, 'gemini', 'data:x', $2, $3, $4, $5, $6, $7, $8)`,
      [
        JSON.stringify(ai),
        confirmed?.vendor ?? null,
        confirmed?.org ?? null,
        confirmed?.date ?? null,
        confirmed?.total ?? null,
        confirmed?.vat ?? null,
        confirmed?.rate ?? null,
        corrected,
      ],
    );
  }

  it("counts labeled/unlabeled/corrected and computes per-field accuracy", async () => {
    const ai = { vendorName: "ICA Maxi", orgNumber: "556677-8899", date: "2026-10-01", totalAmount: 100, vatAmount: 12, vatRate: 12 };
    // Correct read, confirmed as-is.
    await sample(ai, { vendor: "ica maxi", org: "5566778899", date: "2026-10-01", total: "100.00", vat: "12.00", rate: 12 });
    // AI got the vendor and total wrong; user corrected.
    await sample({ ...ai, vendorName: "ICA M4xi", totalAmount: 10 }, { vendor: "ICA Maxi", org: "556677-8899", date: "2026-10-01", total: "100.00", vat: "12.00", rate: 12 }, true);
    // AI read, never confirmed.
    await sample(ai, null);
    await pg.query(`INSERT INTO vendor_corrections (org_number, correct_vendor, times_confirmed) VALUES ('556677-8899','ICA Maxi',3)`);

    const s = await getTrainingStats();
    expect(s.total).toBe(3);
    expect(s.labeled).toBe(2);
    expect(s.unlabeled).toBe(1);
    expect(s.corrected).toBe(1);
    expect(s.withImage).toBe(3);
    const f = Object.fromEntries(s.fields.map((x) => [x.field, x]));
    expect(f.vendor).toEqual({ field: "vendor", checked: 2, correct: 1 });
    expect(f.orgNumber).toEqual({ field: "orgNumber", checked: 2, correct: 2 });
    expect(f.date).toEqual({ field: "date", checked: 2, correct: 2 });
    expect(f.total).toEqual({ field: "total", checked: 2, correct: 1 });
    expect(f.vatRate).toEqual({ field: "vatRate", checked: 2, correct: 2 });
    expect(s.vendorCorrections.total).toBe(1);
    expect(s.vendorCorrections.top[0]).toMatchObject({ vendor: "ICA Maxi", times: 3 });
    expect(s.recentMistakes).toHaveLength(1);
    expect(s.recentMistakes[0]).toMatchObject({ aiVendor: "ICA M4xi", vendor: "ICA Maxi" });
    expect(s.daily.reduce((a, d) => a + d.scans, 0)).toBe(3);
  });

  it("reports notMigrated instead of crashing when the tables are missing", async () => {
    await pg.exec(`DROP TABLE receipt_training_data;`);
    try {
      const s = await getTrainingStats();
      expect(s.notMigrated).toBe(true);
      expect(s.total).toBe(0);
    } finally {
      await pg.exec(readFileSync("./drizzle/0029_training_tables.sql", "utf8").replaceAll("--> statement-breakpoint", ""));
    }
  });

  it("handles an empty dataset without errors", async () => {
    const s = await getTrainingStats();
    expect(s.total).toBe(0);
    expect(s.fields.every((x) => x.checked === 0)).toBe(true);
    expect(s.recentMistakes).toEqual([]);
  });
});
