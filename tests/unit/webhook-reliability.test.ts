import { describe, it, expect, beforeAll, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/db/schema";
import { isTrialExtensionPush } from "@/lib/billing/trial-push";

const pg = new PGlite();
const testDb = drizzle(pg, { schema });
vi.mock("@/db", () => ({ db: testDb }));
const { claimWebhookEvent, markWebhookDone, CLAIM_STALE_MS } = await import("@/lib/billing/webhook-claim");

beforeAll(async () => {
  await pg.exec(
    `CREATE TABLE webhook_events (id varchar(255) primary key, type varchar(120) not null, processed_at timestamptz not null default now())`,
  );
});

describe("claimWebhookEvent", () => {
  it("new, then busy while in flight, then done after markDone", async () => {
    expect(await claimWebhookEvent("evt_1", "x")).toBe("new");
    expect(await claimWebhookEvent("evt_1", "x")).toBe("busy");
    await markWebhookDone(["evt_1"]);
    expect(await claimWebhookEvent("evt_1", "x")).toBe("done");
  });

  it("crashed handler: stale claim without done marker is taken over", async () => {
    const t0 = new Date();
    expect(await claimWebhookEvent("evt_2", "x", t0)).toBe("new");
    const later = new Date(t0.getTime() + CLAIM_STALE_MS + 1000);
    expect(await claimWebhookEvent("evt_2", "x", later)).toBe("new");
    expect(await claimWebhookEvent("evt_2", "x", later)).toBe("busy");
  });
});

describe("isTrialExtensionPush", () => {
  const past = new Date(Date.now() - 86_400_000);
  const future = new Date(Date.now() + 86_400_000);
  it("paying stripe customer with no/finished trial = push", () => {
    expect(isTrialExtensionPush({ subscriptionStatus: "active", subscriptionSource: "stripe", trialEndsAt: null })).toBe(true);
    expect(isTrialExtensionPush({ subscriptionStatus: "active", subscriptionSource: "stripe", trialEndsAt: past })).toBe(true);
  });
  it("new trial from free account is not a push", () => {
    expect(isTrialExtensionPush({ subscriptionStatus: "active", subscriptionSource: null, trialEndsAt: null })).toBe(false);
  });
  it("in-trial plan switch (future trialEndsAt) is not a push", () => {
    expect(isTrialExtensionPush({ subscriptionStatus: "active", subscriptionSource: "stripe", trialEndsAt: future })).toBe(false);
    expect(isTrialExtensionPush({ subscriptionStatus: "trialing", subscriptionSource: "stripe", trialEndsAt: future })).toBe(false);
  });
});
