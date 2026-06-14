import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { mileageRoutes } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  await db
    .delete(mileageRoutes)
    .where(and(eq(mileageRoutes.id, params.id), eq(mileageRoutes.userId, session.user.id)));
  return NextResponse.json({ ok: true });
}
