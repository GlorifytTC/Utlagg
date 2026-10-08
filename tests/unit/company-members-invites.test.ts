import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "node:fs";
import * as schema from "@/db/schema";

/** Real GET /api/company/members over PGlite: pending invites are scoped and safe. */

const pg = new PGlite();
const testDb = drizzle(pg, { schema });
let sessionUser: { id: string; email: string } | null = null;

vi.mock("@/db", () => ({ db: testDb }));
vi.mock("next-auth", () => ({ getServerSession: async () => (sessionUser ? { user: sessionUser } : null) }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logAuditEvent: vi.fn(), clientIp: () => null }));

const { GET } = await import("@/app/api/company/members/route");

async function q<T>(sql: string, p: unknown[] = []) {
  return (await pg.query<T>(sql, p)).rows[0];
}
async function user(email: string) {
  return (await q<{ id: string }>(`INSERT INTO users (email, scan_limit) VALUES ($1,25) RETURNING id`, [email])).id;
}
async function company(name: string, ownerId: string) {
  const { id } = await q<{ id: string }>(`INSERT INTO companies (name) VALUES ($1) RETURNING id`, [name]);
  await pg.query(`INSERT INTO company_members (company_id,user_id,role) VALUES ($1,$2,'owner')`, [id, ownerId]);
  return id;
}
async function invite(companyId: string, email: string, opts: { expired?: boolean; accepted?: boolean } = {}) {
  await pg.query(
    `INSERT INTO company_invites (company_id,email,invitee_name,role,token_hash,expires_at,accepted_at)
     VALUES ($1,$2,'Anna Svensson','admin','secrethash', now() + ($3 || ' days')::interval, $4)`,
    [companyId, email, opts.expired ? "-1" : "7", opts.accepted ? new Date() : null],
  );
}

beforeAll(async () => {
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
});
beforeEach(async () => {
  await pg.exec(`TRUNCATE company_invites, company_members, companies, users RESTART IDENTITY CASCADE;`);
});

describe("GET /api/company/members - pending invites", () => {
  it("owner sees only their own company's open invites, without the token", async () => {
    const owner = await user("owner@a.se");
    const a = await company("A AB", owner);
    const b = await company("B AB", await user("owner@b.se"));
    await invite(a, "open@a.se");
    await invite(a, "old@a.se", { expired: true });
    await invite(a, "done@a.se", { accepted: true });
    await invite(b, "other@b.se");

    sessionUser = { id: owner, email: "owner@a.se" };
    const d = await (await GET()).json();
    expect(d.invites.map((i: { email: string }) => i.email)).toEqual(["open@a.se"]);
    expect(d.invites[0]).toMatchObject({ name: "Anna Svensson", role: "admin" });
    expect(JSON.stringify(d)).not.toContain("secrethash");
  });

  it("a plain member still gets 403 (no roster, no invites)", async () => {
    const owner = await user("owner@a.se");
    const a = await company("A AB", owner);
    const m = await user("m@a.se");
    await pg.query(`INSERT INTO company_members (company_id,user_id,role) VALUES ($1,$2,'member')`, [a, m]);
    await invite(a, "open@a.se");
    sessionUser = { id: m, email: "m@a.se" };
    expect((await GET()).status).toBe(403);
  });
});
