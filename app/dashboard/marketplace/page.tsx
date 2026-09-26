import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AccountantMarketplace } from "@/components/marketplace/AccountantMarketplace";
import { getT } from "@/lib/i18n-server";

export const metadata = { title: "Hitta revisor" };
export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const t = getT();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.navMarketplace}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.mktPageDesc}
        </p>
      </div>
      <AccountantMarketplace />
    </div>
  );
}
