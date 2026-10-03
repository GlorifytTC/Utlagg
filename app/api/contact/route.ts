import { NextResponse, type NextRequest } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sendContactMessage } from "@/lib/email";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Public contact form to the support inbox. */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, "contact");
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const message = String(body?.message ?? "").trim();
  if (!name || name.length > 100 || !EMAIL_RE.test(email) || email.length > 200 || !message || message.length > 5000) {
    return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });
  }

  const ok = await sendContactMessage(name, email, message);
  if (!ok) return NextResponse.json({ error: "Kunde inte skicka" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
