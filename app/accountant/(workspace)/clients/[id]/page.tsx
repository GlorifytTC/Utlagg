import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AccountantClientWorkspace } from "@/components/accountant/AccountantClientWorkspace";
import { getServerLang } from "@/lib/i18n-server";
import { accountantStrings } from "@/lib/accountant-i18n";

export const metadata = { title: "Klient" };
export const dynamic = "force-dynamic";

export default function AccountantClientPage({ params }: { params: { id: string } }) {
  const t = accountantStrings(getServerLang());
  return (
    <div className="space-y-6">
      <Link
        href="/accountant"
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft size={16} /> {t.allClients}
      </Link>
      <AccountantClientWorkspace companyId={params.id} />
    </div>
  );
}
