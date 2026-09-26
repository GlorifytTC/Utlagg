import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AccountantMarketplace } from "@/components/marketplace/AccountantMarketplace";
import { getServerLang } from "@/lib/i18n-server";
import { accountantStrings } from "@/lib/accountant-i18n";

export const metadata = { title: "Marknadsplatsen" };
export const dynamic = "force-dynamic";

export default async function AccountantMarketplacePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const t = accountantStrings(getServerLang());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{t.marketplacePageTitle}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.marketplacePageDesc}
        </p>
      </div>
      <AccountantMarketplace
        viewerAccountantId={session.user.id}
        profileBasePath="/accountant/marketplace"
      />
    </div>
  );
}
