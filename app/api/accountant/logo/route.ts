import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAccountant, validateLogo } from "@/lib/accountant";

export const runtime = "nodejs";

const schema = z.object({ logoUrl: z.string().nullable() });

/**
 * GET / PATCH the authenticated accountant's own logo (base64 data URL).
 * Accountant-only; a user can only change their OWN logo (the id comes from
 * the session, never input). Validated server-side for type + size.
 */
export async function GET() {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });
  const [u] = await db
    .select({ logoUrl: users.logoUrl })
    .from(users)
    .where(eq(users.id, acct.userId))
    .limit(1);
  return NextResponse.json({ logoUrl: u?.logoUrl ?? null });
}

export async function PATCH(req: NextRequest) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });

  const check = validateLogo(parsed.data.logoUrl);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  await db.update(users).set({ logoUrl: parsed.data.logoUrl }).where(eq(users.id, acct.userId));
  return NextResponse.json({ ok: true });
}
