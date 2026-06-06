import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { retentionReport } from "@/lib/compliance";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await retentionReport());
}
