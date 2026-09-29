import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSignedReceiptUrl, isStorageConfigured } from "@/lib/storage";
import { logAuditEvent, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const idSchema = z.string().uuid();
const patchSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(500).optional(),
  // The verificationUpdatedAt the admin saw. If the accountant resubmitted
  // since, the update matches nothing, so an unseen document is never approved.
  seenUpdatedAt: z.string().datetime(),
});

async function loadDoc(userId: string) {
  const [u] = await db
    .select({
      name: users.name,
      docKey: users.verificationDocKey,
      status: users.verificationStatus,
      note: users.verificationNote,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return u?.docKey ? u : null;
}

/** GET: short-lived (5 min) presigned URL to view the accountant's credential scan. */
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });
  if (!idSchema.safeParse(params.userId).success) {
    return NextResponse.json({ error: "Hittades inte" }, { status: 404 });
  }
  const u = await loadDoc(params.userId);
  if (!u) return NextResponse.json({ error: "Inget dokument" }, { status: 404 });
  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "Fillagring är inte konfigurerad" }, { status: 503 });
  }

  await logAuditEvent({
    userId: admin.user!.id,
    action: "admin.verification.view_document",
    entityType: "user",
    entityId: params.userId,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ url: await getSignedReceiptUrl(u.docKey!, 300) });
}

/** PATCH: approve or reject. Rejecting an approved accountant revokes the badge. */
export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });
  if (!idSchema.safeParse(params.userId).success) {
    return NextResponse.json({ error: "Hittades inte" }, { status: 404 });
  }
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });
  const { status, note, seenUpdatedAt } = parsed.data;

  const u = await loadDoc(params.userId);
  if (!u) return NextResponse.json({ error: "Inget dokument" }, { status: 404 });
  // The badge vouches for a name. Without one, a name could later be filled in
  // by someone else (invite flows set a missing name) with the badge kept.
  if (status === "approved" && !u.name?.trim()) {
    return NextResponse.json({ error: "Revisorn saknar namn och kan inte godkännas" }, { status: 400 });
  }

  const updated = await db
    .update(users)
    .set({ verificationStatus: status, verificationNote: note || null, verificationUpdatedAt: new Date() })
    .where(and(eq(users.id, params.userId), eq(users.verificationUpdatedAt, new Date(seenUpdatedAt))))
    .returning({ id: users.id });
  if (!updated.length) {
    return NextResponse.json({ error: "Ärendet har ändrats. Ladda om och granska igen." }, { status: 409 });
  }

  await logAuditEvent({
    userId: admin.user!.id,
    action: status === "approved" ? "admin.verification.approve" : "admin.verification.reject",
    entityType: "user",
    entityId: params.userId,
    oldValues: { status: u.status, note: u.note },
    newValues: { status, note: note || null },
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
