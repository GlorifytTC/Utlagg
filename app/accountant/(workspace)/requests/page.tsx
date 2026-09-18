import { AccountantRequests } from "@/components/accountant/AccountantRequests";

export const metadata = { title: "Förfrågningar" };
export const dynamic = "force-dynamic";

export default function AccountantRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Förfrågningar</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Företag som vill koppla dig som revisor.</p>
      </div>
      <AccountantRequests />
    </div>
  );
}
