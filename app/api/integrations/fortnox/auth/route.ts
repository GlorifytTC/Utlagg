import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFortnoxAuthUrl } from "@/lib/fortnox";

export const runtime = "nodejs";

/** Redirects the signed-in user to Fortnox's consent screen. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  if (!process.env.FORTNOX_CLIENT_ID) {
    return NextResponse.json(
      { error: "Fortnox är inte konfigurerat." },
      { status: 503 },
    );
  }
  // State binds the callback to this user. For full CSRF hardening, also store
  // it server-side (e.g. Redis) and compare on callback.
  const state = `${session.user.id}.${crypto.randomUUID()}`;
  return NextResponse.redirect(getFortnoxAuthUrl(state));
}
