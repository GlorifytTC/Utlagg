import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AccountantMarketplace } from "@/components/marketplace/AccountantMarketplace";
import { getT } from "@/lib/i18n-server";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Hitta revisor" };
export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const t = getT();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={t.navMarketplace} subtitle={t.mktPageDesc} />
      <AccountantMarketplace />
    </div>
  );
}
