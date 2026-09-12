import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import crypto from "node:crypto";

/**
 * Integration tests for the accountant INVITATION FLOW, run against a real
 * Postgres (PGlite) with the actual migrations applied. These exercise the
 * exact query logic the invite + accept routes perform, so the security
 * boundaries (token hashing, email binding, single-use, expiry, needsCompany,
 * idempotency, cross-isolation, no-raw-token) are verified against real SQL,
 * not mocks.
 *
 * The route handlers themselves are thin wrappers over this logic plus
 * requireAccountant()/session (covered by their own auth-layer contract); the
 * data-layer correctness is what these tests lock down.
 */

let pg: PGlite;
const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

async function reset() {
  await pg.exec(`
    TRUNCATE accountant_invites, accountant_clients, company_members, companies, users RESTART IDENTITY CASCADE;
  `);
}

// Minimal fixtures
async function makeUser(email: string, isAccountant = false) {
  const [row] = (
    await pg.query<{ id: string }>(
      `INSERT INTO users (email, is_accountant, scan_limit) VALUES ($1,$2,25) RETURNING id`,
      [email.toLowerCase(), isAccountant],
    )
  ).rows;
  return row.id;
}
async function makeCompany(name: string, ownerId: string) {
  const [c] = (
    await pg.query<{ id: string }>(`INSERT INTO companies (name) VALUES ($1) RETURNING id`, [name])
  ).rows;
  await pg.query(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'owner')`, [
    c.id,
    ownerId,
  ]);
  return c.id;
}
async function makeInvite(
  accountantId: string,
  email: string,
  rawToken: string,
  opts: { expired?: boolean; accepted?: boolean } = {},
) {
  const expires = opts.expired ? "now() - interval '1 day'" : "now() + interval '7 days'";
  const [inv] = (
    await pg.query<{ id: string }>(
      `INSERT INTO accountant_invites (accountant_id, email, token_hash, status, expires_at, accepted_at)
       VALUES ($1,$2,$3,$4, ${expires}, ${opts.accepted ? "now()" : "NULL"}) RETURNING id`,
      [accountantId, email.toLowerCase(), sha256(rawToken), opts.accepted ? "active" : "pending"],
    )
  ).rows;
  return inv.id;
}

/** Replicates the accept route's data logic. Returns a discriminated result. */
async function acceptInvite(sessionUserId: string, sessionEmail: string, rawToken: string) {
  const tokenHash = sha256(rawToken);
  const inv = (
    await pg.query<{
      id: string;
      accountant_id: string;
      email: string;
    }>(
      `SELECT id, accountant_id, email FROM accountant_invites
       WHERE token_hash=$1 AND status='pending' AND accepted_at IS NULL AND expires_at > now() LIMIT 1`,
      [tokenHash],
    )
  ).rows[0];
  if (!inv) return { status: 400 as const };

  if (inv.email && inv.email.toLowerCase() !== sessionEmail.toLowerCase()) {
    return { status: 403 as const };
  }

  const membership = (
    await pg.query<{ company_id: string }>(
      `SELECT company_id FROM company_members WHERE user_id=$1 LIMIT 1`,
      [sessionUserId],
    )
  ).rows[0];
  if (!membership) return { status: 409 as const, needsCompany: true };

  const companyId = membership.company_id;
  const existing = (
    await pg.query<{ id: string; status: string }>(
      `SELECT id, status FROM accountant_clients WHERE accountant_id=$1 AND company_id=$2 LIMIT 1`,
      [inv.accountant_id, companyId],
    )
  ).rows[0];
  if (existing) {
    if (existing.status !== "active") {
      await pg.query(
        `UPDATE accountant_clients SET status='active', activated_at=now(), revoked_at=NULL, revoked_by=NULL WHERE id=$1`,
        [existing.id],
      );
    }
  } else {
    await pg.query(
      `INSERT INTO accountant_clients (accountant_id, company_id, status, activated_at) VALUES ($1,$2,'active',now())`,
      [inv.accountant_id, companyId],
    );
  }
  await pg.query(
    `UPDATE accountant_invites SET status='active', accepted_at=now(), accepted_by=$1, company_id=$2 WHERE id=$3`,
    [sessionUserId, companyId, inv.id],
  );
  return { status: 200 as const, companyId };
}

beforeAll(async () => {
  pg = new PGlite();
  const files = readdirSync("./drizzle")
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const f of files) {
    const sql = readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", "");
    await pg.exec(sql);
  }
});

describe("Accountant invitation flow", () => {
  it("valid invitation creation stores a sha256 hash, never the raw token", async () => {
    await reset();
    const acct = await makeUser("acct@firm.se", true);
    const raw = crypto.randomBytes(32).toString("hex");
    await makeInvite(acct, "client@co.se", raw);
    const row = (
      await pg.query<{ token_hash: string }>(`SELECT token_hash FROM accountant_invites LIMIT 1`)
    ).rows[0];
    expect(row.token_hash).toBe(sha256(raw));
    expect(row.token_hash).not.toContain(raw); // the raw token is never stored
    expect(row.token_hash).toHaveLength(64);
  });

  it("client with an existing company accepts successfully and activates exactly one relationship", async () => {
    await reset();
    const acct = await makeUser("acct@firm.se", true);
    const client = await makeUser("client@co.se");
    await makeCompany("Client AB", client);
    const raw = crypto.randomBytes(32).toString("hex");
    await makeInvite(acct, "client@co.se", raw);

    const res = await acceptInvite(client, "client@co.se", raw);
    expect(res.status).toBe(200);

    const rels = (
      await pg.query<{ status: string }>(`SELECT status FROM accountant_clients`)
    ).rows;
    expect(rels).toHaveLength(1);
    expect(rels[0].status).toBe("active");

    const inv = (
      await pg.query<{ status: string; accepted_by: string | null }>(
        `SELECT status, accepted_by FROM accountant_invites LIMIT 1`,
      )
    ).rows[0];
    expect(inv.status).toBe("active");
    expect(inv.accepted_by).toBe(client);
  });

  it("client WITHOUT a company gets 409 + needsCompany, and retry after creating one succeeds", async () => {
    await reset();
    const acct = await makeUser("acct@firm.se", true);
    const client = await makeUser("client@co.se"); // no company yet
    const raw = crypto.randomBytes(32).toString("hex");
    await makeInvite(acct, "client@co.se", raw);

    const first = await acceptInvite(client, "client@co.se", raw);
    expect(first.status).toBe(409);
    expect((first as { needsCompany?: boolean }).needsCompany).toBe(true);
    // no relationship created on the 409 path
    expect((await pg.query(`SELECT 1 FROM accountant_clients`)).rows).toHaveLength(0);

    // client creates their company (existing flow), then retries the SAME token
    await makeCompany("Client AB", client);
    const second = await acceptInvite(client, "client@co.se", raw);
    expect(second.status).toBe(200);
    expect((await pg.query(`SELECT 1 FROM accountant_clients`)).rows).toHaveLength(1);
  });

  it("invalid token is rejected", async () => {
    await reset();
    const acct = await makeUser("acct@firm.se", true);
    const client = await makeUser("client@co.se");
    await makeCompany("Client AB", client);
    await makeInvite(acct, "client@co.se", crypto.randomBytes(32).toString("hex"));
    const res = await acceptInvite(client, "client@co.se", "not-the-real-token");
    expect(res.status).toBe(400);
  });

  it("expired token is rejected", async () => {
    await reset();
    const acct = await makeUser("acct@firm.se", true);
    const client = await makeUser("client@co.se");
    await makeCompany("Client AB", client);
    const raw = crypto.randomBytes(32).toString("hex");
    await makeInvite(acct, "client@co.se", raw, { expired: true });
    const res = await acceptInvite(client, "client@co.se", raw);
    expect(res.status).toBe(400);
  });

  it("wrong-email acceptance is rejected (403) — leaked link can't be redeemed by another account", async () => {
    await reset();
    const acct = await makeUser("acct@firm.se", true);
    const other = await makeUser("someone-else@co.se");
    await makeCompany("Other AB", other);
    const raw = crypto.randomBytes(32).toString("hex");
    await makeInvite(acct, "client@co.se", raw); // invited client@, not other@
    const res = await acceptInvite(other, "someone-else@co.se", raw);
    expect(res.status).toBe(403);
    expect((await pg.query(`SELECT 1 FROM accountant_clients`)).rows).toHaveLength(0);
  });

  it("email binding is case-insensitive", async () => {
    await reset();
    const acct = await makeUser("acct@firm.se", true);
    const client = await makeUser("Client@Co.SE");
    await makeCompany("Client AB", client);
    const raw = crypto.randomBytes(32).toString("hex");
    await makeInvite(acct, "client@co.se", raw);
    const res = await acceptInvite(client, "CLIENT@CO.SE", raw);
    expect(res.status).toBe(200);
  });

  it("already-accepted invitation cannot be reused (single-use)", async () => {
    await reset();
    const acct = await makeUser("acct@firm.se", true);
    const client = await makeUser("client@co.se");
    await makeCompany("Client AB", client);
    const raw = crypto.randomBytes(32).toString("hex");
    await makeInvite(acct, "client@co.se", raw);
    expect((await acceptInvite(client, "client@co.se", raw)).status).toBe(200);
    // second use of the same token now finds no pending invite
    expect((await acceptInvite(client, "client@co.se", raw)).status).toBe(400);
  });

  it("acceptance is idempotent at the relationship level (retry doesn't duplicate)", async () => {
    await reset();
    const acct = await makeUser("acct@firm.se", true);
    const client = await makeUser("client@co.se");
    const companyId = await makeCompany("Client AB", client);
    // Pre-existing active relationship (simulates a re-invite/retry)
    await pg.query(
      `INSERT INTO accountant_clients (accountant_id, company_id, status, activated_at) VALUES ($1,$2,'active',now())`,
      [acct, companyId],
    );
    const raw = crypto.randomBytes(32).toString("hex");
    await makeInvite(acct, "client@co.se", raw);
    const res = await acceptInvite(client, "client@co.se", raw);
    expect(res.status).toBe(200);
    // still exactly one relationship (unique pair constraint + upsert logic)
    expect((await pg.query(`SELECT 1 FROM accountant_clients`)).rows).toHaveLength(1);
  });

  it("revoked relationship flips back to active on a fresh valid accept", async () => {
    await reset();
    const acct = await makeUser("acct@firm.se", true);
    const client = await makeUser("client@co.se");
    const companyId = await makeCompany("Client AB", client);
    await pg.query(
      `INSERT INTO accountant_clients (accountant_id, company_id, status, revoked_at) VALUES ($1,$2,'revoked',now())`,
      [acct, companyId],
    );
    const raw = crypto.randomBytes(32).toString("hex");
    await makeInvite(acct, "client@co.se", raw);
    await acceptInvite(client, "client@co.se", raw);
    const rel = (
      await pg.query<{ status: string; revoked_at: string | null }>(
        `SELECT status, revoked_at FROM accountant_clients LIMIT 1`,
      )
    ).rows[0];
    expect(rel.status).toBe("active");
    expect(rel.revoked_at).toBeNull();
  });

  it("cross-accountant isolation: accepting accountant A's invite never grants access to accountant B", async () => {
    await reset();
    const acctA = await makeUser("a@firm.se", true);
    const acctB = await makeUser("b@firm.se", true);
    const client = await makeUser("client@co.se");
    const companyId = await makeCompany("Client AB", client);
    const raw = crypto.randomBytes(32).toString("hex");
    await makeInvite(acctA, "client@co.se", raw);
    await acceptInvite(client, "client@co.se", raw);

    const aHas = (
      await pg.query(
        `SELECT 1 FROM accountant_clients WHERE accountant_id=$1 AND company_id=$2 AND status='active'`,
        [acctA, companyId],
      )
    ).rows.length;
    const bHas = (
      await pg.query(
        `SELECT 1 FROM accountant_clients WHERE accountant_id=$1 AND company_id=$2 AND status='active'`,
        [acctB, companyId],
      )
    ).rows.length;
    expect(aHas).toBe(1);
    expect(bHas).toBe(0); // B gained nothing
  });

  it("unique (accountant, company) constraint prevents duplicate relationship rows", async () => {
    await reset();
    const acct = await makeUser("acct@firm.se", true);
    const client = await makeUser("client@co.se");
    const companyId = await makeCompany("Client AB", client);
    await pg.query(
      `INSERT INTO accountant_clients (accountant_id, company_id, status) VALUES ($1,$2,'active')`,
      [acct, companyId],
    );
    await expect(
      pg.query(
        `INSERT INTO accountant_clients (accountant_id, company_id, status) VALUES ($1,$2,'active')`,
        [acct, companyId],
      ),
    ).rejects.toThrow(); // unique index enforces one row per pair
  });
});
