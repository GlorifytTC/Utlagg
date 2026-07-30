import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { DEFAULT_OVERAGE_CAP_ORE } from "@/lib/billing/config";

export const runtime = "nodejs";

/**
 * User-adjustable monthly overage spend cap (spec §3.4). Accepts kronor and
 * stores öre. When usage hits the cap, metering stops auto-billing overage and
 * notifies rather than generating a surprise invoice.
 */
const schema = z.object({
  // Max ceiling in kronor (0 = block all overage). Upper bound keeps a typo
  // from authorising a runaway bill.
  capKr: z.number().int().min(0).max(100_000),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltig gräns" }, { status: 400 });
  }
  const capOre = parsed.data.capKr * 100;

  const updated = await db
    .update(subscriptions)
    .set({ overageSpendCapOre: capOre })
    .where(eq(subscriptions.userId, session.user.id))
    .returning({ id: subscriptions.id });

  if (updated.length === 0) {
    return NextResponse.json(
      { error: "Ingen prenumeration att uppdatera" },
      { status: 404 },
    );
  }

  await logAudit({
    userId: session.user.id,
    action: "billing.overage_cap_set",
    details: `cap=${capOre}öre`,
  });

  return NextResponse.json({
    ok: true,
    capOre,
    defaultCapOre: DEFAULT_OVERAGE_CAP_ORE,
  });
}
