import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAccountant } from "@/lib/accountant";
import { validateCredentialDoc } from "@/lib/verification";
import { isStorageConfigured, uploadReceiptImage, deleteReceiptImageIfR2 } from "@/lib/storage";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logAuditEvent, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({ document: z.string() });

/**
 * POST: the authenticated accountant submits a credential scan for manual
 * review. Sets their verification status to "pending". Only an admin can
 * approve or reject (see /api/admin/verifications). An already-verified
 * accountant cannot swap the document.
 */
export async function POST(req: NextRequest) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const limited = await enforceRateLimit(req, "accountant-verification", acct.userId);
  if (limited) return limited;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });
  const check = validateCredentialDoc(parsed.data.document);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  const [u] = await db
    .select({ status: users.verificationStatus, docKey: users.verificationDocKey })
    .from(users)
    .where(eq(users.id, acct.userId))
    .limit(1);
  if (u?.status === "approved") {
    return NextResponse.json({ error: "Du är redan verifierad" }, { status: 409 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "Fillagring är inte konfigurerad" }, { status: 503 });
  }

  // ponytail: stored under the user's receipts/ prefix so the existing
  // account-deletion purge (deleteAllUserImages) and deleteReceiptImageIfR2
  // cover it. The key is built here from the session id, never from input.
  const { key } = await uploadReceiptImage(acct.userId, `verification-${randomUUID()}`, parsed.data.document);
  await db
    .update(users)
    .set({ verificationStatus: "pending", verificationDocKey: key, verificationNote: null, verificationUpdatedAt: new Date() })
    .where(eq(users.id, acct.userId));
  await deleteReceiptImageIfR2(u?.docKey, acct.userId);

  await logAuditEvent({
    userId: acct.userId,
    action: "accountant.verification.submit",
    entityType: "user",
    entityId: acct.userId,
    oldValues: { status: u?.status ?? null },
    newValues: { status: "pending" },
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
