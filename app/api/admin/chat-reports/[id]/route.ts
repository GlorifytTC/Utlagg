import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { chatReports } from "@/db/schema";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const { status, moderatorNote } = await req.json();
  if (status !== "resolved" && status !== "dismissed") {
    return NextResponse.json({ error: "Ogiltigt status" }, { status: 400 });
  }

  await db
    .update(chatReports)
    .set({
      status,
      moderatorId: admin.user.id,
      moderatorNote: moderatorNote ?? null,
      moderatedAt: new Date(),
    })
    .where(eq(chatReports.id, params.id));

  return NextResponse.json({ ok: true });
}
