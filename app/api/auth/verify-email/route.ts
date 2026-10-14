import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { pricingV3Enabled, trialRequireCard } from "@/lib/billing/config";
import { beginTrialState, checkTrialEligibility } from "@/lib/billing/trial";

export const runtime = "nodejs";

/** GET /api/auth/verify-email?token=... - marks the email verified. */
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

  // No-card trial starts on verification (the email is the identity anchor).
  // Accountants are free and never trialled. Failure must not block verify.
  if (pricingV3Enabled() && !trialRequireCard() && !user.isAccountant) {
    try {
      if ((await checkTrialEligibility(user.id, user.email)).eligible) {
        await beginTrialState({ userId: user.id });
      }
    } catch (e) {
      console.error("trial start failed:", e);
    }
  }

  return NextResponse.redirect(new URL("/login?verify=success", req.url));
}
