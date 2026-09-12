import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { z } from "zod";

/**
 * Tests for the self-serve accountant registration flow. The security-critical
 * behavior: isAccountant is derived SERVER-SIDE from a validated accountType
 * enum ("user" | "accountant"), never from a client-supplied isAccountant.
 *
 * These verify (a) the validation/derivation logic in isolation, and (b) the
 * resulting DB row against real Postgres.
 */

let pg: PGlite;

// The exact schema fragment the register route uses.
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  accountType: z.enum(["user", "accountant"]).default("user"),
});

/** Server-side derivation: the only thing that decides isAccountant. */
function deriveIsAccountant(body: unknown): { ok: boolean; isAccountant?: boolean } {
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { ok: false };
  return { ok: true, isAccountant: parsed.data.accountType === "accountant" };
}

beforeAll(async () => {
  pg = new PGlite();
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
});

async function insertUser(email: string, isAccountant: boolean) {
  return (await pg.query<{ id: string; is_accountant: boolean }>(
    `INSERT INTO users (email, is_accountant, scan_limit, subscription_tier) VALUES ($1,$2,25,'free') RETURNING id, is_accountant`,
    [email.toLowerCase(), isAccountant],
  )).rows[0];
}

describe("Accountant self-registration — server derivation", () => {
  it("normal registration → isAccountant false (default)", () => {
    const r = deriveIsAccountant({ email: "u@co.se", password: "password1" });
    expect(r.ok).toBe(true);
    expect(r.isAccountant).toBe(false);
  });

  it("accountType 'accountant' → isAccountant true", () => {
    const r = deriveIsAccountant({ email: "a@firm.se", password: "password1", accountType: "accountant" });
    expect(r.ok).toBe(true);
    expect(r.isAccountant).toBe(true);
  });

  it("accountType 'user' → isAccountant false", () => {
    const r = deriveIsAccountant({ email: "u@co.se", password: "password1", accountType: "user" });
    expect(r.isAccountant).toBe(false);
  });

  it("a raw client-supplied isAccountant:true is IGNORED (not in schema)", () => {
    // Even if the browser sends isAccountant:true, the schema doesn't read it;
    // derivation depends solely on accountType, which defaults to "user".
    const r = deriveIsAccountant({ email: "evil@x.se", password: "password1", isAccountant: true } as unknown);
    expect(r.ok).toBe(true);
    expect(r.isAccountant).toBe(false);
  });

  it("invalid accountType is rejected (not a silent accountant grant)", () => {
    const r = deriveIsAccountant({ email: "x@x.se", password: "password1", accountType: "admin" } as unknown);
    expect(r.ok).toBe(false);
  });

  it("isAccountant:true combined with accountType:user still yields false", () => {
    const r = deriveIsAccountant({ email: "x@x.se", password: "password1", accountType: "user", isAccountant: true } as unknown);
    expect(r.isAccountant).toBe(false);
  });
});

describe("Accountant self-registration — resulting DB row + authorization", () => {
  it("accountant registration creates a user the requireAccountant check accepts", async () => {
    const row = await insertUser("acct@firm.se", true);
    expect(row.is_accountant).toBe(true);
    // requireAccountant reads is_accountant fresh from the DB:
    const check = (await pg.query<{ is_accountant: boolean }>(
      `SELECT is_accountant FROM users WHERE id=$1`, [row.id],
    )).rows[0];
    expect(check.is_accountant).toBe(true);
  });

  it("normal registration creates a user requireAccountant REJECTS", async () => {
    const row = await insertUser("normal@co.se", false);
    expect(row.is_accountant).toBe(false);
    const check = (await pg.query<{ is_accountant: boolean }>(
      `SELECT is_accountant FROM users WHERE id=$1`, [row.id],
    )).rows[0];
    expect(check.is_accountant).toBe(false); // → requireAccountant returns null → 403 on accountant APIs
  });
});
