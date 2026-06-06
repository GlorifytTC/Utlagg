import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Admin gate. NOTE: users.role defaults to 'admin' for everyone in this schema,
 * so it is NOT a safe signal. We gate on an explicit ADMIN_EMAILS allowlist
 * (comma-separated) instead. Add your email there to access /admin.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

/** Returns the session if the caller is an admin, else null. */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) return null;
  return session;
}
