import { NextResponse } from "next/server";
import { currentTier } from "@/lib/entitlements";
import { entitlementsFor } from "@/lib/features";
import { planForTier } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lightweight entitlements for the client UI (locks, upsell). */
export async function GET() {
  const ctx = await currentTier();
  if (!ctx) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  return NextResponse.json({
    tier: ctx.tier,
    planName: planForTier(ctx.tier).name,
    features: entitlementsFor(ctx.tier),
  });
}
