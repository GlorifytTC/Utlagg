import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CompanyAccountantAudit } from "@/components/dashboard/CompanyAccountantAudit";

export const metadata = { title: "Revisorsaktivitet" };
export const dynamic = "force-dynamic";

export default function AccountantActivityPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/dashboard/company"
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft size={15} /> Företagsinställningar
        </Link>
        <h1 className="font-display text-2xl font-semibold text-gray-900 dark:text-white">
          Revisorsaktivitet
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Alla åtgärder dina revisorer har utfört de senaste 30 dagarna.
        </p>
      </div>

      <CompanyAccountantAudit />
    </div>
  );
}
