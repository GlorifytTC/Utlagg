import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sendVerificationEmail } from "@/lib/email";
import { checkLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email() });

/**
 * Resend the verification link for someone who isn't logged in yet (the
 * normal /api/auth/resend-verification requires a session, but an
 * unverified account can't create one). Always responds the same way
 * whether or not the email exists, so this can't be used to probe accounts.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }
  if (!(await checkLimit("auth", `resend-pub:${clientIp(req) ?? parsed.data.email}`))) {
    return NextResponse.json({ error: "För många försök" }, { status: 429 });
  }

  const email = parsed.data.email.toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (user && !user.emailVerified) {
    const raw = crypto.randomBytes(32).toString("hex");
    await db
      .update(users)
      .set({
        emailVerificationToken: crypto.createHash("sha256").update(raw).digest("hex"),
        emailVerificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .where(eq(users.id, user.id));
    await sendVerificationEmail(user.email, user.name ?? "där", raw);
  }

  return NextResponse.json({ ok: true });
}
