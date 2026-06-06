import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { monthlySeries } from "@/lib/admin-metrics";

export const runtime = "nodejs";

/**
 * NOTE: real MRR-over-time would need historical MRR snapshots, which we don't
 * store. This returns the real monthly *signups* and *receipts* series instead,
 * which is honest data rather than a fabricated revenue trend.
 */
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await monthlySeries());
}
