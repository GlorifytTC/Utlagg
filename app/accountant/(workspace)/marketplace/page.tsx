import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AccountantMarketplace } from "@/components/marketplace/AccountantMarketplace";
import { getServerLang, metaTitle } from "@/lib/i18n-server";
import { accountantStrings } from "@/lib/accountant-i18n";
import { PageHeader } from "@/components/ui/page-header";

export const generateMetadata = metaTitle("Marknadsplatsen", "Marketplace");
export const dynamic = "force-dynamic";

export default async function AccountantMarketplacePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const t = accountantStrings(getServerLang());

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={t.marketplacePageTitle} subtitle={t.marketplacePageDesc} />
      <AccountantMarketplace
        viewerAccountantId={session.user.id}
        profileBasePath="/accountant/marketplace"
      />
    </div>
  );
}
