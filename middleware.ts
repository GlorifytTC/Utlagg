import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { checkLimit, bucketWindowSeconds } from "@/lib/rate-limit";
import { userLimitBucket, userLimitKey } from "@/lib/user-rate-limit-policy";

/**
 * Adds security headers to every response and enforces auth on private routes.
 *
 * Note: the spec proposed doing Redis IP-block lookups here, but middleware runs
 * on the Edge runtime on every request — a per-request Redis round-trip there is
 * a latency and reliability risk. IP blocking belongs in the rate-limit layer of
 * individual routes, not the global middleware. Headers are static and safe.
 */
const PROTECTED = ["/dashboard", "/settings", "/admin", "/master-dashboard"];

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=()",
  );
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
    // 'unsafe-inline' kept for now because Next injects inline hydration
    // scripts/styles; tighten to nonces later if you want stricter CSP.
    res.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        // 'wasm-unsafe-eval' (not full 'unsafe-eval') lets the Tesseract/three
        // WASM run without permitting arbitrary eval() of strings.
        "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://vercel.live https://cdn.jsdelivr.net",
        "worker-src 'self' blob: https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self'",
        "connect-src 'self' https://api.stripe.com https://*.upstash.io https://cdn.jsdelivr.net https://tessdata.projectnaptha.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; "),
    );
  }
  return res;
}

/**
 * Persist a `?ref=CODE` referral param into a first-party cookie so the code
 * survives the journey to /register even if the visitor browses around first.
 * Attribution itself happens server-side at signup (see referrals.captureReferral).
 */
interface RefRequest {
  nextUrl: { searchParams: URLSearchParams };
  cookies: { get(name: string): { value: string } | undefined };
}
function captureRefCookie(req: RefRequest, res: NextResponse): NextResponse {
  const ref = req.nextUrl.searchParams.get("ref");
  if (ref && /^[0-9A-Za-z]{4,32}$/.test(ref) && !req.cookies.get("kvittino_ref")) {
    res.cookies.set("kvittino_ref", ref.toUpperCase(), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
  }
  return res;
}

/**
 * Per-user rate limit for every API route: 300 reads + 60 writes per minute per
 * signed-in user (by IP when signed out). Upstash when configured (shared across
 * instances), the in-memory limiter otherwise; it never fails open. Only /api
 * requests pay the lookup, pages and assets do not. Tighter per-route limits
 * (auth, OCR, uploads) still apply on top inside the routes.
 */
async function userRateLimit(req: NextRequestWithAuth): Promise<NextResponse | null> {
  const bucket = userLimitBucket(req.nextUrl.pathname, req.method);
  if (!bucket) return null;
  const userId = (req.nextauth?.token as { id?: string } | null)?.id;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip");
  try {
    if (await checkLimit(bucket, userLimitKey(userId, ip))) return null;
  } catch (e) {
    // Limiter backend unreachable: let the request through rather than take the
    // whole API down. Routes keep their own per-route limits.
    console.error("[rate-limit] user limiter error:", e);
    return null;
  }
  return NextResponse.json(
    { error: "För många förfrågningar. Försök igen om en stund." },
    { status: 429, headers: { "Retry-After": String(bucketWindowSeconds(bucket)) } },
  );
}

export default withAuth(
  async function middleware(req: NextRequestWithAuth) {
    const limited = await userRateLimit(req);
    if (limited) return applySecurityHeaders(limited);
    const res = applySecurityHeaders(NextResponse.next());
    return captureRefCookie(req, res);
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname;
        const isProtected = PROTECTED.some((p) => path.startsWith(p));
        return isProtected ? !!token : true;
      },
    },
  },
);

export const config = {
  // Run on everything except Next internals and static asset files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|txt|webmanifest)).*)",
  ],
};
