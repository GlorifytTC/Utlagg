import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { isEmailConfigured, verifyEmailConnection, sendTestEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Admin-only diagnostic for the Brevo HTTP API setup. Visit GET to check
 * config + connection without sending anything; POST { "to": "you@example.com" }
 * to actually send a test email and see the full result. This avoids the
 * register → wait → check-logs cycle while debugging delivery problems.
 *
 * Auth: either a logged-in admin session, OR a `x-debug-secret` header
 * matching CRON_SECRET — the latter exists so this is reachable even while
 * you can't log in yet (e.g. while debugging the verification email itself).
 */
async function authorized(req: NextRequest): Promise<boolean> {
  const headerSecret = req.headers.get("x-debug-secret");
  if (headerSecret && process.env.CRON_SECRET && headerSecret === process.env.CRON_SECRET) {
    return true;
  }
  return Boolean(await requireAdmin());
}

export async function GET(req: NextRequest) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only BREVO_API_KEY + BREVO_FROM_EMAIL/NAME are used now (HTTP API, not
  // SMTP) — BREVO_SMTP_HOST/LOGIN/PORT are vestigial and ignored.
  const masked = {
    BREVO_API_KEY: process.env.BREVO_API_KEY
      ? `${process.env.BREVO_API_KEY.slice(0, 8)}... (len ${process.env.BREVO_API_KEY.length})`
      : "(not set)",
    BREVO_FROM_EMAIL: process.env.BREVO_FROM_EMAIL ?? "(not set)",
    BREVO_FROM_NAME: process.env.BREVO_FROM_NAME ?? "(not set)",
  };

  const configured = isEmailConfigured();
  const connection = configured
    ? await verifyEmailConnection()
    : { ok: false as const, error: "Not configured — see env vars above" };

  return NextResponse.json({ configured, env: masked, connection });
}

export async function POST(req: NextRequest) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const to = body?.to;
  if (!to || typeof to !== "string") {
    return NextResponse.json({ error: "Body must be { \"to\": \"email@example.com\" }" }, { status: 400 });
  }

  const result = await sendTestEmail(to);
  return NextResponse.json(result);
}
