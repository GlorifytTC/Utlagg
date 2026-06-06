import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

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
        "script-src 'self' 'unsafe-inline' https://vercel.live",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self'",
        "connect-src 'self' https://api.stripe.com https://*.upstash.io",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; "),
    );
  }
  return res;
}

export default withAuth(
  function middleware() {
    return applySecurityHeaders(NextResponse.next());
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
