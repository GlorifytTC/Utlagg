import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Tests the /api/notifications event-selection logic against real Postgres
 * (PGlite) with the actual migrations. Replicates the route's SQL: events
 * strictly NEWER than `since`, chat messages exclude the caller's own, and a
 * `since` of "now" yields nothing (no backlog toasted on first poll).
 */

let pg: PGlite;

async function reset() {
  await pg.exec(
    `TRUNCATE chat_messages, accountant_connection_requests, accountant_clients, company_members, companies, users RESTART IDENTITY CASCADE;`,
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
async function makeActiveClient(accountantId: string, companyId: string) {
  return (await pg.query<{ id: string }>(
    `INSERT INTO accountant_clients (accountant_id, company_id, status, activated_at) VALUES ($1,$2,'active',now()) RETURNING id`,
    [accountantId, companyId],
  )).rows[0].id;
}
async function sendMessage(clientId: string, senderId: string, role: string, body: string) {
  await pg.query(`INSERT INTO chat_messages (client_id, sender_id, sender_role, body) VALUES ($1,$2,$3,$4)`, [clientId, senderId, role, body]);
}

/** Mirrors the route's message + pending-request selection for one caller. */
async function collectEvents(me: string, since: string, opts: { isAccountant: boolean; companyId?: string }) {
  const events: Array<{ type: string; actorName: string | null }> = [];
  if (opts.isAccountant) {
    const reqs = (await pg.query<{ name: string }>(
      `SELECT c.name FROM accountant_connection_requests r JOIN companies c ON c.id=r.company_id
       WHERE r.accountant_id=$1 AND r.status='pending' AND r.created_at > $2`,
      [me, since],
    )).rows;
    for (const r of reqs) events.push({ type: "connection_request", actorName: r.name });
  }
  const rels = (await pg.query<{ id: string }>(
    `SELECT id FROM accountant_clients WHERE accountant_id=$1 OR company_id=$2`,
    [me, opts.companyId ?? null],
  )).rows.map((r) => r.id);
  if (rels.length) {
    const msgs = (await pg.query<{ name: string }>(
      `SELECT u.name FROM chat_messages m JOIN users u ON u.id=m.sender_id
       WHERE m.client_id = ANY($1) AND m.sender_id <> $2 AND m.created_at > $3`,
      [rels, me, since],
    )).rows;
    for (const m of msgs) events.push({ type: "message", actorName: m.name });
  }
  return events;
}

beforeAll(async () => {
  pg = new PGlite();
  for (const f of readdirSync("./drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync("./drizzle/" + f, "utf8").replaceAll("--> statement-breakpoint", ""));
  }
});

describe("Notifications — event selection", () => {
  it("returns a chat message from the other party sent after `since`", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    const owner = await makeUser("owner@co.se");
    const company = await makeCompany("Client AB", owner);
    const client = await makeActiveClient(acct, company);
    const past = new Date(Date.now() - 60_000).toISOString();
    await sendMessage(client, owner, "company", "hej");
    const events = await collectEvents(acct, past, { isAccountant: true, companyId: undefined });
    expect(events.filter((e) => e.type === "message")).toHaveLength(1);
  });

  it("excludes the caller's OWN messages", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    const owner = await makeUser("owner@co.se");
    const company = await makeCompany("Client AB", owner);
    const client = await makeActiveClient(acct, company);
    const past = new Date(Date.now() - 60_000).toISOString();
    await sendMessage(client, acct, "accountant", "my own message");
    const events = await collectEvents(acct, past, { isAccountant: true });
    expect(events.filter((e) => e.type === "message")).toHaveLength(0);
  });

  it("`since = now` returns nothing (no backlog on first poll)", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    const owner = await makeUser("owner@co.se");
    const company = await makeCompany("Client AB", owner);
    const client = await makeActiveClient(acct, company);
    await sendMessage(client, owner, "company", "old");
    const now = new Date().toISOString();
    const events = await collectEvents(acct, now, { isAccountant: true });
    expect(events).toHaveLength(0);
  });

  it("returns a pending connection request to an accountant after `since`", async () => {
    await reset();
    const acct = await makeUser("a@firm.se", true);
    const owner = await makeUser("owner@co.se");
    const company = await makeCompany("Client AB", owner);
    await pg.query(`INSERT INTO accountant_connection_requests (company_id, accountant_id, requested_by, status) VALUES ($1,$2,$3,'pending')`, [company, acct, owner]);
    const past = new Date(Date.now() - 60_000).toISOString();
    const events = await collectEvents(acct, past, { isAccountant: true });
    expect(events.filter((e) => e.type === "connection_request")).toHaveLength(1);
    expect(events[0].actorName).toBe("Client AB");
  });
});
