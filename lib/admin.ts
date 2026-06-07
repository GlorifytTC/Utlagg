import "server-only";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * Admin gate. A user is an admin if EITHER:
 *   (a) their users.role = 'admin' (the normal path — promote via /api/admin/promote), OR
 *   (b) their email is in the ADMIN_EMAILS allowlist (bootstrap, so the owner can
 *       always get in and promote the first real admin without a chicken-and-egg).
 * New users default to role 'member' and are NOT admins.
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

type SessionLike = Session | null;

/** True if this session belongs to an admin (role OR allowlist). */
export async function isAdminUser(session: SessionLike): Promise<boolean> {
  if (!session?.user?.id) return false;
  if (isAdminEmail(session.user.email)) return true;
  const [u] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  return u?.role === "admin";
}

/** For API routes: returns the session if admin, else null. */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(await isAdminUser(session))) return null;
  return session;
}

/** For pages/layouts: distinguishes "not logged in" from "not admin". */
export async function adminGate(): Promise<
  { state: "ok"; session: Session } | { state: "anon" } | { state: "forbidden" }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { state: "anon" };
  if (!(await isAdminUser(session))) return { state: "forbidden" };
  return { state: "ok", session };
}
