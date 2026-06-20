import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { checkLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

/**
 * After a failed credentials sign-in, the login page calls this to find out
 * *why* it failed — wrong password, or correct password but unverified
 * email — since NextAuth v4 collapses every authorize() failure into one
 * generic error. Requires the correct password so it can't be used to probe
 * whether an email is registered.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ reason: "invalid" });
  if (!(await checkLimit("auth", `checkv:${clientIp(req) ?? parsed.data.email}`))) {
    return NextResponse.json({ error: "För många försök" }, { status: 429 });
  }

  const email = parsed.data.email.toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || !user.hashedPassword) return NextResponse.json({ reason: "invalid" });
  const valid = await bcrypt.compare(parsed.data.password, user.hashedPassword);
  if (!valid) return NextResponse.json({ reason: "invalid" });

  return NextResponse.json({ reason: user.emailVerified ? "verified" : "unverified" });
}
