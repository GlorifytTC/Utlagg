import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public health check for uptime monitors. 200 = app + DB reachable. */
export async function GET() {
  const start = Date.now();
  try {
    await (db as { execute: (q: unknown) => Promise<unknown> }).execute(sql`select 1`);
    return NextResponse.json({
      status: "ok",
      db: "up",
      latencyMs: Date.now() - start,
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "degraded", db: "down", time: new Date().toISOString() },
      { status: 503 },
    );
  }
}
