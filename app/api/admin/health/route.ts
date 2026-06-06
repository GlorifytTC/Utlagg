import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { checkAll } from "@/lib/health-checks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ checks: await checkAll() });
}
