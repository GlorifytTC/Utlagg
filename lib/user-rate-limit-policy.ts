/**
 * Which per-user rate-limit bucket an API request falls in (pure, edge-safe,
 * unit-tested). Used by middleware.ts for every /api route.
 *
 * Excluded (null): server-to-server callers that must never be throttled per
 * user (Stripe/email webhooks, cron, CSP reports, health checks) and NextAuth's
 * own endpoints, which the session poller hits constantly and which already
 * have IP-based auth limits on the sensitive routes.
 */
export type UserLimitBucket = "userRead" | "userWrite";

// Matched on whole path segments: "/api/health" excludes /api/health and
// /api/health/db, never a lookalike such as /api/healthz-admin.
const EXCLUDED = ["/api/webhooks", "/api/cron", "/api/inbound/email", "/api/csp-report", "/api/health", "/api/auth"];

export function userLimitBucket(pathname: string, method: string): UserLimitBucket | null {
  if (!pathname.startsWith("/api/")) return null;
  if (EXCLUDED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  const m = method.toUpperCase();
  if (m === "OPTIONS") return null;
  return m === "GET" || m === "HEAD" ? "userRead" : "userWrite";
}

/**
 * Extra, tighter bucket for specific routes, checked on top of the general
 * one: creating a receipt is limited to 10 a minute per user.
 */
export function routeLimitBucket(pathname: string, method: string): "receiptCreate" | null {
  const path = pathname.replace(/\/+$/, "");
  return path === "/api/receipts" && method.toUpperCase() === "POST" ? "receiptCreate" : null;
}

/** Rate-limit key: the signed-in user's id, else the client IP. */
export function userLimitKey(userId: string | null | undefined, ip: string | null | undefined): string {
  return userId ? `u:${userId}` : `ip:${ip || "anonymous"}`;
}
