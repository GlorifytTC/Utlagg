import { AccountantRequests } from "@/components/accountant/AccountantRequests";

export const metadata = { title: "Förfrågningar" };
export const dynamic = "force-dynamic";

export default function AccountantRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Förfrågningar</h1>
        <p className="text-ink/60">Företag som vill koppla dig som revisor.</p>
      </div>
      <AccountantRequests />
    </div>
  );
}
