import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, accountantClients, accountantReviews } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";

export const runtime = "nodejs";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).nullable().optional(),
});

/**
 * POST /api/marketplace/accountants/[id]/reviews — submit or update a review.
 *
 * Requires an active accountant_clients relationship between the viewer's
 * company and this accountant. One review per company; subsequent POSTs
 * update the existing review (upsert on the unique pair index).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { id: accountantId } = await params;

  // Target must be an accountant.
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, accountantId), eq(users.isAccountant, true)))
    .limit(1);
  if (!target) return NextResponse.json({ error: "Revisorn hittades inte." }, { status: 404 });

  const viewerCompany = await getUserCompany(session.user.id);
  if (!viewerCompany) return NextResponse.json({ error: "Inget företag." }, { status: 403 });
  if (!canManageCompany(viewerCompany.role)) {
    return NextResponse.json({ error: "Endast ägare/admin kan lämna recension." }, { status: 403 });
  }

  // Must have an active relationship to review.
  const [rel] = await db
    .select({ id: accountantClients.id })
    .from(accountantClients)
    .where(
      and(
        eq(accountantClients.accountantId, accountantId),
        eq(accountantClients.companyId, viewerCompany.companyId),
        eq(accountantClients.status, "active"),
      ),
    )
    .limit(1);
  if (!rel) {
    return NextResponse.json(
      { error: "Ni måste ha en aktiv koppling för att lämna recension." },
      { status: 403 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltig recension." }, { status: 400 });

  const { rating, comment } = parsed.data;

  // Upsert — one review per (accountantId, companyId) pair.
  const [existing] = await db
    .select({ id: accountantReviews.id })
    .from(accountantReviews)
    .where(
      and(
        eq(accountantReviews.accountantId, accountantId),
        eq(accountantReviews.companyId, viewerCompany.companyId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(accountantReviews)
      .set({ rating, comment: comment ?? null, reviewedBy: session.user.id, updatedAt: new Date() })
      .where(eq(accountantReviews.id, existing.id));
  } else {
    await db.insert(accountantReviews).values({
      accountantId,
      companyId: viewerCompany.companyId,
      reviewedBy: session.user.id,
      rating,
      comment: comment ?? null,
    });
  }

  return NextResponse.json({ ok: true });
}
