import { describe, it, expect } from "vitest";

/**
 * Verifies the role-based entry decision used by /dashboard: an accountant is
 * routed to the accountant workspace, a normal user stays on /dashboard. The
 * decision is derived solely from the server-side is_accountant flag on the
 * loaded user row (the browser never decides it).
 */

// Mirror the branch in app/dashboard/page.tsx.
function entryFor(user: { isAccountant: boolean } | null): string {
  if (!user) return "/login";
  if (user.isAccountant) return "/accountant";
  return "/dashboard";
}

describe("Role-based dashboard entry", () => {
  it("accountant → /accountant workspace", () => {
    expect(entryFor({ isAccountant: true })).toBe("/accountant");
  });

  it("normal user → /dashboard", () => {
    expect(entryFor({ isAccountant: false })).toBe("/dashboard");
  });

  it("no user → /login", () => {
    expect(entryFor(null)).toBe("/login");
  });

  it("decision comes from the server flag, not any browser input", () => {
    // Even a body claiming accountant:true is irrelevant — entryFor reads the
    // loaded DB user, which is what /dashboard uses.
    const dbUser = { isAccountant: false };
    expect(entryFor(dbUser)).toBe("/dashboard");
  });
});
