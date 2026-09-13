import { AccountantDiscovery } from "@/components/accountant/AccountantDiscovery";

export const metadata = { title: "Upptäck företag" };
export const dynamic = "force-dynamic";

export default function AccountantDiscoverPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Företag som söker revisor</h1>
        <p className="text-ink/60">
          Företag som valt att synas. Skicka en förfrågan — du får åtkomst först när de
          accepterar.
        </p>
      </div>
      <AccountantDiscovery />
    </div>
  );
}
