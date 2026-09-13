import Link from "next/link";
import { Suspense } from "react";
import { AccountantClientsList } from "@/components/accountant/AccountantClientsList";
import { AccountantDiscovery } from "@/components/accountant/AccountantDiscovery";
import { AccountantOverview } from "@/components/accountant/AccountantOverview";
import { AccountantBoostCard } from "@/components/accountant/AccountantBoostCard";

export const metadata = { title: "Översikt" };
export const dynamic = "force-dynamic";

export default function AccountantDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Översikt</h1>
        <p className="text-ink/60">Dina klienter och nya möjligheter.</p>
      </div>

      <AccountantOverview />

      <Suspense fallback={null}>
        <AccountantBoostCard />
      </Suspense>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Företag som söker revisor</h2>
          <Link href="/accountant/discover" className="text-sm text-nordic-600 hover:underline">
            Visa alla →
          </Link>
        </div>
        <AccountantDiscovery compact />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Mina klienter</h2>
        <AccountantClientsList />
      </section>
    </div>
  );
}
