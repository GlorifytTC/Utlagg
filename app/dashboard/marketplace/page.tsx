import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AccountantMarketplace } from "@/components/marketplace/AccountantMarketplace";

export const metadata = { title: "Hitta revisor" };
export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Hitta revisor</h1>
        <p className="text-sm text-ink/50">
          Bläddra bland redovisningskonsulter och skicka en förfrågan — åtkomst ges när revisorn accepterar.
        </p>
      </div>
      <AccountantMarketplace />
    </div>
  );
}
