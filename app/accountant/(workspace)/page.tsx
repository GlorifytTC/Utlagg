import { AccountantClientsList } from "@/components/accountant/AccountantClientsList";

export const metadata = { title: "Klienter" };
export const dynamic = "force-dynamic";

export default function AccountantClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Klienter</h1>
        <p className="text-ink/60">Företag du har åtkomst till.</p>
      </div>
      <AccountantClientsList />
    </div>
  );
}
