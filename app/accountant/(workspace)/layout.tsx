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
    <main className="min-h-screen bg-[#F5F4F0] dark:bg-black dark:text-gray-100">
      <header className="sticky top-0 z-30 border-b border-gray-900/[0.07] bg-white/75 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0A0A0A]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/accountant">
            <Logo size={28} wordmarkClassName="text-[17px] text-gray-900 dark:text-white" />
          </Link>
          <AccountantAvatarMenu />
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-6 pb-20 pt-6">
        <AccountantNav />
        {children}
        <AccountantFooter />
      </div>
    </main>
  );
}
