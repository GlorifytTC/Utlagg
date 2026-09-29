import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { NextRequest } from "next/server";
import * as schema from "@/db/schema";

/**
 * Regression tests for the backend-audit hotfix. Unlike most tests here these
 * call the REAL route handlers, with `@/db` pointed at PGlite running the
 * actual migrations, so a reverted guard fails the test.
 */

const pg = new PGlite();
const testDb = drizzle(pg, { schema });
let sessionUser: { id: string; email: string } | null = null;

vi.mock("@/db", () => ({ db: testDb }));
vi.mock("next-auth", () => ({ getServerSession: async () => (sessionUser ? { user: sessionUser } : null) }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logAuditEvent: vi.fn(), clientIp: () => null }));
vi.mock("@/lib/email", () => ({ sendVerificationEmail: vi.fn(async () => true) }));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: async () => null,
  checkLimit: async () => ({ ok: true, success: true }),
}));

const { POST: acceptAsAccountant } = await import("@/app/api/accountant/connection-requests/[id]/accept/route");
const { POST: acceptAsCompany } = await import("@/app/api/company/accountant-requests/[id]/accept/route");
const { PUT: updateReceipt } = await import("@/app/api/receipts/[id]/route");
const { POST: register } = await import("@/app/api/auth/register/route");
const { keyBelongsToUser } = await import("@/lib/storage");

const req = (body?: unknown) =>
  new NextRequest("http://test.local/api", {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

async function one<T>(sql: string, params: unknown[] = []): Promise<T> {
  return (await pg.query<T>(sql, params)).rows[0];
}
async function makeUser(email: string, extra = "", vals: unknown[] = []) {
  return (await one<{ id: string }>(
    `INSERT INTO users (email, scan_limit${extra ? ", " + extra : ""}) VALUES ($1, 25${vals.map((_, i) => `, $${i + 2}`).join("")}) RETURNING id`,
    [email, ...vals],
  )).id;
}
async function makeCompany(ownerId: string) {
  const { id } = await one<{ id: string }>(`INSERT INTO companies (name) VALUES ('Client AB') RETURNING id`);
  await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'owner')`, [id, ownerId]);
  return id;
}
async function connRequest(companyId: string, accountantId: string, requestedBy: string) {
  return (await one<{ id: string }>(
    `INSERT INTO accountant_connection_requests (company_id, accountant_id, requested_by, status) VALUES ($1,$2,$3,'pending') RETURNING id`,
    [companyId, accountantId, requestedBy],
  )).id;
}
const hasAccess = async (acct: string, company: string) =>
  (await pg.query(`SELECT 1 FROM accountant_clients WHERE accountant_id=$1 AND company_id=$2 AND status='active'`, [acct, company])).rows.length > 0;

beforeAll(async () => {
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
  // ponytail: columns in db/schema.ts that no migration creates yet (audit H10).
  // Drop this once the catch-up migration lands.
  await pg.exec(`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS approved_by uuid`);
});

beforeEach(async () => {
  sessionUser = null;
  await pg.exec(`TRUNCATE users, companies RESTART IDENTITY CASCADE`);
});

describe("C2: connection requests need the other side's consent", () => {
  it("accountant cannot accept a request they sent themselves", async () => {
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", "is_accountant", [true]);
    const company = await makeCompany(owner);
    const id = await connRequest(company, acct, acct);

    sessionUser = { id: acct, email: "a@firm.se" };
    const res = await acceptAsAccountant(req(), { params: { id } });
    expect(res.status).toBe(403);
    expect(await hasAccess(acct, company)).toBe(false);
  });

  it("company cannot accept a request it sent itself", async () => {
    const owner = await makeUser("owner@co.se");
    const acct = await makeUser("a@firm.se", "is_accountant", [true]);
    const company = await makeCompany(owner);
    const id = await connRequest(company, acct, owner);

    sessionUser = { id: owner, email: "owner@co.se" };
    const res = await acceptAsCompany(req(), { params: { id } });
    expect(res.status).toBe(403);
    expect(await hasAccess(acct, company)).toBe(false);
  });
});

describe("C3: members whose receipts need approval can't approve them", () => {
  async function setup() {
    const owner = await makeUser("owner@co.se");
    const member = await makeUser("m@co.se");
    const company = await makeCompany(owner);
    await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'member')`, [company, member]);
    const { id } = await one<{ id: string }>(
      `INSERT INTO receipts (user_id, company_id, status, total_amount) VALUES ($1,$2,'approved','100.00') RETURNING id`,
      [member, company],
    );
    return { owner, member, id };
  }

  it("rejects a status change from a gated member", async () => {
    const { member, id } = await setup();
    await pg.query(`UPDATE receipts SET status='pending' WHERE id=$1`, [id]);
    sessionUser = { id: member, email: "m@co.se" };
    const res = await updateReceipt(req({ status: "approved" }), { params: { id } });
    expect(res.status).toBe(403);
    expect((await one<{ status: string }>(`SELECT status FROM receipts WHERE id=$1`, [id])).status).toBe("pending");
  });

  it("editing an approved receipt sends it back for approval", async () => {
    const { member, id } = await setup();
    sessionUser = { id: member, email: "m@co.se" };
    const res = await updateReceipt(req({ totalAmount: 99999 }), { params: { id } });
    expect(res.status).toBe(200);
    expect((await one<{ status: string }>(`SELECT status FROM receipts WHERE id=$1`, [id])).status).toBe("pending");
  });

  it("a solo user can still approve their own receipt", async () => {
    const solo = await makeUser("solo@x.se");
    const { id } = await one<{ id: string }>(`INSERT INTO receipts (user_id, status) VALUES ($1,'pending') RETURNING id`, [solo]);
    sessionUser = { id: solo, email: "solo@x.se" };
    const res = await updateReceipt(req({ status: "approved" }), { params: { id } });
    expect(res.status).toBe(200);
  });
});

describe("C4: register never deletes a real account", () => {
  it("keeps a BankID user whose placeholder email is re-registered", async () => {
    const email = "bankid+abc123@bankid.local";
    const victim = await makeUser(email, "bank_id_subject", ["abc123"]);
    const res = await register(req({ email, password: "hunter2hunter2" }));
    expect(res.status).toBe(409);
    expect(await one(`SELECT id FROM users WHERE id=$1`, [victim])).toBeTruthy();
  });

  it("keeps an invite-created user who hasn't set a password yet", async () => {
    const invited = await makeUser("invitee@co.se");
    const res = await register(req({ email: "invitee@co.se", password: "hunter2hunter2" }));
    expect(res.status).toBe(409);
    expect(await one(`SELECT id FROM users WHERE id=$1`, [invited])).toBeTruthy();
  });

  it("still recycles an abandoned self-registration", async () => {
    const stale = await makeUser(
      "late@x.se",
      "hashed_password, email_verification_token_expires",
      ["x", new Date(Date.now() - 1000)],
    );
    const res = await register(req({ email: "late@x.se", password: "hunter2hunter2" }));
    expect(res.status).not.toBe(409);
    expect(await one(`SELECT id FROM users WHERE id=$1`, [stale])).toBeUndefined();
  });
});

describe("H3: R2 key ownership", () => {
  it("only matches the owner's prefix and rejects traversal", () => {
    expect(keyBelongsToUser("receipts/u1/r.jpg", "u1")).toBe(true);
    expect(keyBelongsToUser("receipts/u2/r.jpg", "u1")).toBe(false);
    expect(keyBelongsToUser("receipts/u1/../u2/r.jpg", "u1")).toBe(false);
  });
});
