import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, count, desc, eq, gte, ilike, inArray, lte, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { receipts, users, companyMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit, clientIp } from "@/lib/audit";
import { getUserCompany } from "@/lib/company";
import { suggestBasCode } from "@/lib/auto-categorize";
import { getBasAccount } from "@/lib/bas";

export const runtime = "nodejs";

// Columns the receipt LIST needs. Deliberately excludes the heavy fields —
// `imageUrl` (often a full base64 data URL) and `receiptText` (raw OCR) — so
// the list payload stays tiny no matter how many receipts a user has. The
// image is loaded lazily on the per-receipt detail page instead. `hasImage`
// lets the UI show an indicator without shipping the bytes.
const listColumns = {
  id: receipts.id,
  vendorName: receipts.vendorName,
  date: receipts.date,
  totalAmount: receipts.totalAmount,
  vatAmount: receipts.vatAmount,
  vatRate: receipts.vatRate,
  basCode: receipts.basCode,
  category: receipts.category,
  status: receipts.status,
  createdAt: receipts.createdAt,
  hasImage: sql<boolean>`${receipts.imageUrl} is not null`,
} as const;

const SORT_COLUMNS = {
  date: receipts.date,
  vendor: receipts.vendorName,
  bas: receipts.basCode,
  vat: receipts.vatAmount,
  amount: receipts.totalAmount,
  status: receipts.status,
} as const;

const MAX_PAGE_SIZE = 100;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(sp.get("pageSize")) || 25),
  );
  const q = sp.get("q")?.trim() ?? "";
  const from = sp.get("from");
  const to = sp.get("to");
  const sortKey = (sp.get("sort") ?? "date") as keyof typeof SORT_COLUMNS;
  const sortCol = SORT_COLUMNS[sortKey] ?? receipts.date;
  const dir = sp.get("dir") === "asc" ? sql`asc` : sql`desc`;

  const conditions = [eq(receipts.userId, session.user.id)];
  if (q) {
    const like = `%${q}%`;
    conditions.push(
      or(
        ilike(receipts.vendorName, like),
        ilike(receipts.basCode, like),
        ilike(sql`${receipts.totalAmount}::text`, like),
      )!,
    );
  }
  if (from) conditions.push(gte(receipts.date, new Date(from)));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(receipts.date, end));
  }
  const where = and(...conditions);

  const [rows, totals] = await Promise.all([
    db
      .select(listColumns)
      .from(receipts)
      .where(where)
      // NULLS LAST keeps unset fields at the bottom either direction; the
      // createdAt tiebreak makes pagination deterministic on ties.
      .orderBy(sql`${sortCol} ${dir} nulls last`, desc(receipts.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(receipts).where(where),
  ]);

  return NextResponse.json({
    receipts: rows,
    total: totals[0]?.total ?? 0,
    page,
    pageSize,
  });
}

const createSchema = z.object({
  imageUrl: z.string().optional(),
  receiptNumber: z.string().max(60).optional(),
  vendorName: z.string().optional(),
  date: z.string().datetime().optional(),
  totalAmount: z.number().nonnegative().optional(),
  vatAmount: z.number().nonnegative().optional(),
  vatRate: z.union([z.literal(6), z.literal(12), z.literal(25)]).optional(),
  category: z.string().optional(),
  basCode: z.string().optional(),
  aiConfidence: z.number().min(0).max(1).optional(),
  receiptText: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ogiltiga kvittouppgifter" },
        { status: 400 },
      );
    }

    // Enforce scan limit (scanLimit === -1 means unlimited).
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "Användare saknas" }, { status: 404 });
    }

    if (user.scanLimit !== -1 && user.scansUsedThisMonth >= user.scanLimit) {
      return NextResponse.json(
        {
          error:
            "Du har nått månadens gräns. Uppgradera för obegränsade skanningar.",
          code: "SCAN_LIMIT_REACHED",
        },
        { status: 402 },
      );
    }

    const d = parsed.data;
    const membership = await getUserCompany(userId);
    // Members need approval only if the company actually has an approver
    // (owner/admin/approver besides them). Otherwise auto-approve.
    let receiptStatus: "pending" | "approved" = "approved";
    if (membership && membership.role === "member") {
      const approvers = await db
        .select({ id: companyMembers.id })
        .from(companyMembers)
        .where(
          and(
            eq(companyMembers.companyId, membership.companyId),
            ne(companyMembers.userId, userId),
            inArray(companyMembers.role, ["owner", "admin", "approver"]),
          ),
        );
      if (approvers.length > 0) receiptStatus = "pending";
    }
    // Safety net: if the client didn't send a category (e.g. an older app
    // build, or a direct API call), suggest one from the vendor name here
    // too, so receipts never silently land in "no category" when a known
    // merchant was recognized.
    const basCode = d.basCode ?? suggestBasCode(d.vendorName) ?? undefined;
    const category = d.category ?? (basCode ? getBasAccount(basCode)?.name : undefined);

    const [created] = await db
      .insert(receipts)
      .values({
        userId,
        companyId: membership?.companyId ?? null,
        imageUrl: d.imageUrl,
        receiptNumber: d.receiptNumber,
        vendorName: d.vendorName,
        date: d.date ? new Date(d.date) : undefined,
        totalAmount: d.totalAmount?.toFixed(2),
        vatAmount: d.vatAmount?.toFixed(2),
        vatRate: d.vatRate,
        category,
        basCode,
        aiConfidence: d.aiConfidence,
        receiptText: d.receiptText,
        // Only regular employees (member) need manager approval; owners,
        // admins, approvers and solo users (no company) are auto-approved.
        status: receiptStatus,
      })
      .returning();

    if (user.scanLimit !== -1) {
      await db
        .update(users)
        .set({ scansUsedThisMonth: user.scansUsedThisMonth + 1 })
        .where(eq(users.id, userId));
    }

    await logAudit({
      userId,
      action: "receipt.create",
      details: `Receipt ${created.id} (${d.vendorName ?? "okänd"})`,
      ipAddress: clientIp(req),
    });

    return NextResponse.json({ receipt: created }, { status: 201 });
  } catch (err) {
    console.error("receipt create error:", err);
    return NextResponse.json({ error: "Kunde inte spara kvittot" }, { status: 500 });
  }
}
