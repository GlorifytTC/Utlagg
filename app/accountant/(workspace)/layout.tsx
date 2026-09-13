import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAccountant } from "@/lib/accountant";
import { Logo } from "@/components/brand/Logo";
import { AccountantNav } from "@/components/accountant/AccountantNav";
import { AccountantAvatarMenu } from "@/components/accountant/AccountantAvatarMenu";
import { AccountantFooter } from "@/components/accountant/AccountantFooter";

export const dynamic = "force-dynamic";

/**
 * Accountant workspace shell. Mirrors the existing DashboardShell visual
 * language exactly (bg-paper, max-w-5xl, Logo header, rounded-full hairline
 * buttons) so the accountant experience reads as a native part of the product.
 *
 * This layout wraps the (workspace) route group only — the /accountant/accept
 * page (used by CLIENTS accepting an invite, who are not accountants) stays
 * outside it and is intentionally ungated.
 *
 * Gating is server-side via requireAccountant(): non-accountant → /dashboard,
 * anonymous → handled by requireAccountant returning null → /dashboard. The UI
 * never authorizes anything itself; every accountant API re-checks server-side.
 */
export default async function AccountantWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const acct = await requireAccountant();
  if (!acct) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/accountant">
          <Logo size={30} wordmarkClassName="text-xl" />
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <AccountantAvatarMenu />
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-6 pb-20">
        <AccountantNav />
        {children}
        <AccountantFooter />
      </div>
    </main>
  );
}
