import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { companyVehicles, companyMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const [m] = await db
    .select()
    .from(companyMembers)
    .where(eq(companyMembers.userId, session.user.id))
    .limit(1);
  if (!m || (m.role !== "owner" && m.role !== "admin")) {
    return NextResponse.json({ error: "Behörighet saknas." }, { status: 403 });
  }
  await db
    .delete(companyVehicles)
    .where(and(eq(companyVehicles.id, params.id), eq(companyVehicles.companyId, m.companyId)));
  return NextResponse.json({ ok: true });
}
