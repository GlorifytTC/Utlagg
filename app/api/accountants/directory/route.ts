import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq, ilike, or, asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_PAGE_SIZE = 50;

/**
 * GET /api/accountants/directory — authenticated-app discovery of accountants.
 *
 * Any signed-in user may browse users who chose to create an accountant
 * account (isAccountant = true). This is NOT a public/anonymous directory and
 * grants NO access — it only lets a company find an accountant to then send a
 * connection request to (which the accountant must accept).
 *
 * SAFETY: returns ONLY safe display fields (id, name, email). No password,
 * credentials, billing, subscription, tokens, or any other user column is
 * selected. Results are bounded (pageSize ≤ 50) and search is limited to
 * name/email, so this is never an unbounded enumeration of the users table.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(sp.get("pageSize")) || 20));

  const conds = [eq(users.isAccountant, true)];
  if (q) {
    const like = `%${q}%`;
    conds.push(or(ilike(users.name, like), ilike(users.email, like))!);
  }

  const rows = await db
    .select({
      // ONLY safe display fields — explicitly no other user columns.
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(and(...conds))
    .orderBy(asc(users.name), asc(users.email))
    .limit(pageSize + 1) // fetch one extra to compute hasMore
    .offset((page - 1) * pageSize);

  const hasMore = rows.length > pageSize;
  const accountants = hasMore ? rows.slice(0, pageSize) : rows;

  return NextResponse.json({ accountants, page, pageSize, hasMore });
}
