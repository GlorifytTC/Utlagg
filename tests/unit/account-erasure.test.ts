import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "node:fs";
import * as schema from "@/db/schema";

const pg = new PGlite();
const testDb = drizzle(pg, { schema });
const cancel = vi.fn(async () => ({}));
const delCustomer = vi.fn(async () => ({}));
const deleteImages = vi.fn(async () => {});

vi.mock("@/db", () => ({ db: testDb }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/stripe", () => ({ stripe: { subscriptions: { cancel }, customers: { del: delCustomer } } }));
vi.mock("@/lib/storage", () => ({ deleteAllUserImages: deleteImages }));

const { eraseUser } = await import("@/lib/account-erasure");

async function q<T>(sql: string, p: unknown[] = []) {
  return (await pg.query<T>(sql, p)).rows;
}
const uid = async (email: string) =>
  (await q<{ id: string }>(`INSERT INTO users (email, hashed_password, name) VALUES ($1,'hash','Name') RETURNING id`, [email]))[0].id;

beforeAll(async () => {
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
  // receipts.approved_by is in db/schema.ts but in no migration (known drift).
  await pg.exec(`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES users(id)`);
});
beforeEach(async () => {
  await pg.exec(`TRUNCATE users, companies RESTART IDENTITY CASCADE;`);
  cancel.mockClear();
  delCustomer.mockClear();
  deleteImages.mockClear();
});

describe("eraseUser", () => {
  it("cancels a TRIALING subscription too", async () => {
    const u = await uid("a@x.se");
    await q(`INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status) VALUES ($1,'cus_1','sub_1','trialing')`, [u]);
    await eraseUser(u);
    expect(cancel).toHaveBeenCalledWith("sub_1");
    expect(await q(`SELECT 1 FROM users WHERE id=$1`, [u])).toHaveLength(0);
  });

  it("solo user: everything deleted, images purged", async () => {
    const u = await uid("solo@x.se");
    await q(`INSERT INTO receipts (user_id, vendor_name) VALUES ($1,'ICA')`, [u]);
    expect((await eraseUser(u)).tombstoned).toBe(false);
    expect(await q(`SELECT 1 FROM receipts`)).toHaveLength(0);
  });

  it("company receipts survive while the company has other members; PII scrubbed", async () => {
    const leaver = await uid("leaver@x.se");
    const stays = await uid("stays@x.se");
    const [{ id: co }] = await q<{ id: string }>(`INSERT INTO companies (name) VALUES ('Co AB') RETURNING id`);
    await q(`INSERT INTO company_members (company_id, user_id, role) VALUES ($1,$2,'owner'),($1,$3,'member')`, [co, stays, leaver]);
    await q(`INSERT INTO receipts (user_id, company_id, vendor_name, image_url) VALUES ($1,$2,'Biltema','receipts/k.jpg')`, [leaver, co]);
    await q(`INSERT INTO receipts (user_id, vendor_name) VALUES ($1,'Personal')`, [leaver]);
    // A receipt of someone else that the leaver approved must not block erasure.
    const [{ id: r }] = await q<{ id: string }>(`INSERT INTO receipts (user_id, company_id, vendor_name) VALUES ($1,$2,'X') RETURNING id`, [stays, co]);
    await q(`UPDATE receipts SET approved_by=$1 WHERE id=$2`, [leaver, r]);

    expect((await eraseUser(leaver)).tombstoned).toBe(true);

    const kept = await q<{ vendor_name: string }>(`SELECT vendor_name FROM receipts WHERE user_id=$1`, [leaver]);
    expect(kept.map((k) => k.vendor_name)).toEqual(["Biltema"]);
    expect(deleteImages).toHaveBeenCalledWith(leaver, new Set(["receipts/k.jpg"]));
    const [t] = await q<{ email: string; hashed_password: string | null; name: string | null }>(`SELECT email, hashed_password, name FROM users WHERE id=$1`, [leaver]);
    expect(t.email).toBe(`deleted-${leaver}@deleted.invalid`);
    expect(t.hashed_password).toBeNull();
    expect(t.name).toBeNull();
    expect((await q(`SELECT approved_by FROM receipts WHERE id=$1`, [r]))[0]).toEqual({ approved_by: null });
  });
});
