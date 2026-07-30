import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { referralSummary } from "@/lib/referrals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The signed-in user's referral code, shareable link and reward status counts
 * for the referral dashboard (spec §4).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  const summary = await referralSummary(session.user.id);
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://kvittino.se";
  return NextResponse.json({
    ...summary,
    shareUrl: `${baseUrl}/?ref=${summary.code}`,
  });
}
