import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AccountantMarketplace } from "@/components/marketplace/AccountantMarketplace";

export const metadata = { title: "Marknadsplatsen" };
export const dynamic = "force-dynamic";

export default async function AccountantMarketplacePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Marknadsplatsen</h1>
        <p className="text-ink/60">
          Så här ser företag dig. Din profil visas bland alla revisorer — rankad efter
          relevans, popularitet och om du har en aktiv boost.
        </p>
      </div>
      <AccountantMarketplace
        viewerAccountantId={session.user.id}
        profileBasePath="/accountant/marketplace"
      />
    </div>
  );
}
