import { AccountantClientsList } from "@/components/accountant/AccountantClientsList";
import { getServerLang } from "@/lib/i18n-server";
import { accountantStrings } from "@/lib/accountant-i18n";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Klienter" };
export const dynamic = "force-dynamic";

export default function AccountantClientsPage() {
  const t = accountantStrings(getServerLang());
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={t.clientsTitle} />
      <AccountantClientsList />
    </div>
  );
}
