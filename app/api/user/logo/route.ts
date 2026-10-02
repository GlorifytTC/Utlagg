import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { validateLogo } from "@/lib/accountant";

export const runtime = "nodejs";

const schema = z.object({ logoUrl: z.string().nullable() });

/** GET / PATCH the signed-in user's own profile picture (base64 data URL). The id comes from the session, never input. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const [u] = await db.select({ logoUrl: users.logoUrl }).from(users).where(eq(users.id, session.user.id)).limit(1);
  return NextResponse.json({ logoUrl: u?.logoUrl ?? null });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });

  const check = validateLogo(parsed.data.logoUrl);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  await db.update(users).set({ logoUrl: parsed.data.logoUrl }).where(eq(users.id, session.user.id));
  return NextResponse.json({ ok: true });
}
