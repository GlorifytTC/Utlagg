import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";

/** A claim older than this with no `done:` marker is a crashed handler. */
export const CLAIM_STALE_MS = 2 * 60_000;

export type ClaimResult = "new" | "done" | "busy";

/**
 * Idempotency claim for a webhook event. A bare row isn't enough: a handler
 * that crashes after claiming would make Stripe's retry look like a duplicate
 * and silently drop the event. So completion is a separate `done:<id>` row.
 *  - new:  caller owns the event and must call markDone() on success.
 *  - done: already fully processed.
 *  - busy: claimed recently by another delivery (reply 409 so Stripe retries).
 */
export async function claimWebhookEvent(
  id: string,
  type: string,
  now: Date = new Date(),
): Promise<ClaimResult> {
  const [row] = await db
    .insert(webhookEvents)
    .values({ id, type, processedAt: now })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id });
  if (row) return "new";

  const [done] = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(eq(webhookEvents.id, `done:${id}`))
    .limit(1);
  if (done) return "done";

  const [taken] = await db
    .update(webhookEvents)
    .set({ processedAt: now })
    .where(
      and(
        eq(webhookEvents.id, id),
        lt(webhookEvents.processedAt, new Date(now.getTime() - CLAIM_STALE_MS)),
      ),
    )
    .returning({ id: webhookEvents.id });
  return taken ? "new" : "busy";
}

export async function markWebhookDone(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await db
    .insert(webhookEvents)
    .values(ids.map((id) => ({ id: `done:${id}`, type: "done" })))
    .onConflictDoNothing();
}
