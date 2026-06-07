import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { logAuditEvent, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("admin"),
});

/** Promote/demote a user. Admin-only. POST { email, role? } (role defaults to 'admin'). */
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ange en giltig e-post och roll" }, { status: 400 });
  }

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1);
  if (!target) return NextResponse.json({ error: "Användaren hittades inte" }, { status: 404 });

  await db.update(users).set({ role: parsed.data.role }).where(eq(users.id, target.id));
  await logAuditEvent({
    userId: session.user!.id,
    action: parsed.data.role === "admin" ? "admin.promote" : "admin.demote",
    entityType: "user",
    entityId: target.id,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true, email: parsed.data.email, role: parsed.data.role });
}
