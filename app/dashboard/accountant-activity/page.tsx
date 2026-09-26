import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CompanyAccountantAudit } from "@/components/dashboard/CompanyAccountantAudit";
import { getT } from "@/lib/i18n-server";

export const metadata = { title: "Revisorsaktivitet" };
export const dynamic = "force-dynamic";

export default function AccountantActivityPage() {
  const t = getT();
  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/dashboard/company"
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft size={15} /> {t.companySettings}
        </Link>
        <h1 className="font-display text-2xl font-semibold text-gray-900 dark:text-white">
          {t.cauTitle}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.cauPageDesc}
        </p>
      </div>

      <CompanyAccountantAudit />
    </div>
  );
}
