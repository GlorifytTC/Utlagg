import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const runtime = "nodejs";

/** GET /api/auth/verify-email?token=... — marks the email verified. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?verify=invalid", req.url));
  }
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.emailVerificationToken, tokenHash),
        gt(users.emailVerificationTokenExpires, new Date()),
      ),
    )
    .limit(1);

  if (!user) {
    return NextResponse.redirect(new URL("/login?verify=invalid", req.url));
  }

  await db
    .update(users)
    .set({
      emailVerified: new Date(),
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
    })
    .where(eq(users.id, user.id));

  return NextResponse.redirect(new URL("/login?verify=success", req.url));
}
