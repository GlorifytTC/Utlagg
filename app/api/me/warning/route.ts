import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

export const runtime = "nodejs";

/** Returns the user's unseen moderator warning (or null) and marks it seen. */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const [u] = await db
    .select({ warning: users.pendingWarning })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (u?.warning != null) {
    await db.update(users).set({ pendingWarning: null }).where(eq(users.id, session.user.id));
  }

  return NextResponse.json({ warning: u?.warning ?? null });
}
