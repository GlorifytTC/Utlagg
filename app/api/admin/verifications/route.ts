import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { users } from "@/db/schema";

export const runtime = "nodejs";

const STATUSES = ["pending", "approved", "rejected"] as const;

/** GET ?status=pending|approved|rejected: accountants in that verification state. */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const param = req.nextUrl.searchParams.get("status") ?? "pending";
  const status = STATUSES.find((s) => s === param);
  if (!status) return NextResponse.json({ error: "Ogiltigt status" }, { status: 400 });

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      verificationStatus: users.verificationStatus,
      verificationNote: users.verificationNote,
      verificationUpdatedAt: users.verificationUpdatedAt,
    })
    .from(users)
    .where(and(eq(users.isAccountant, true), eq(users.verificationStatus, status)))
    .orderBy(desc(users.verificationUpdatedAt))
    .limit(200);

  return NextResponse.json({ accountants: rows });
}
