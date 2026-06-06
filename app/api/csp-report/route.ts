import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/** Collects browser CSP violation reports. Logged, not stored (high volume). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const report = body["csp-report"] ?? body;
    logger.warn(
      {
        ip: clientIp(req),
        userAgent: req.headers.get("user-agent"),
        violatedDirective: report?.["violated-directive"],
        blockedUri: report?.["blocked-uri"],
        documentUri: report?.["document-uri"],
      },
      "csp violation",
    );
  } catch {
    /* ignore malformed reports */
  }
  return new NextResponse(null, { status: 204 });
}
