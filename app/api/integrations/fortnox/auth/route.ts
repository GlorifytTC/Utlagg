import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFortnoxAuthUrl } from "@/lib/fortnox";
import { saveOAuthState } from "@/lib/oauth-state";

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
  // State binds the callback to this user. Stored server-side (single-use, TTL)
  // for CSRF/replay protection; the userId prefix is the fallback when Upstash
  // isn't configured (see consumeOAuthState / oauthStateEnabled).
  const state = `${session.user.id}.${crypto.randomUUID()}`;
  await saveOAuthState(state, session.user.id);
  return NextResponse.redirect(getFortnoxAuthUrl(state));
}
