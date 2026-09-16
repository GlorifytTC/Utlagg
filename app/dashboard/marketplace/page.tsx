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
        <p className="text-ink/60">
          Bläddra bland redovisningskonsulter. Skicka en förfrågan — du får åtkomst till din
          revisor först när hen accepterar.
        </p>
      </div>
      <AccountantMarketplace />
    </div>
  );
}
