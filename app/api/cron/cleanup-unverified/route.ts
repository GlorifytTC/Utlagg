import { NextResponse, type NextRequest } from "next/server";
import { and, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const runtime = "nodejs";

/**
 * Removes accounts that registered but never clicked the verification link
 * before their 24h token expired. Without this, a stale unverified row sits
 * on the email forever, blocking that person from registering again (the
 * /api/auth/register route also does this cleanup opportunistically on a
 * retry, but a real account never gets stuck waiting on someone else to
 * try the same email).
 * Vercel Cron calls this with `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const deleted = await db
    .delete(users)
    .where(
      and(
        isNull(users.emailVerified),
        lt(users.emailVerificationTokenExpires, new Date()),
      ),
    )
    .returning({ id: users.id, email: users.email });

  return NextResponse.json({ removed: deleted.length });
}
