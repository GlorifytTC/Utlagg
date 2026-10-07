import { computeMetrics } from "@/lib/admin-metrics";
import { formatSek } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatGrid } from "@/components/ui/stat";

export const metadata = { title: "Admin · Översikt" };
export const dynamic = "force-dynamic";

// Internal admin tool: Swedish-only by design, strings are inline (no i18n).
export default async function AdminOverview() {
  const m = await computeMetrics();
  const cards = [
    { label: "MRR", value: formatSek(m.mrr) },
    { label: "ARR", value: formatSek(m.arr) },
    { label: "Betalande kunder", value: String(m.payingCustomers) },
    { label: "Användare totalt", value: String(m.totalUsers) },
    { label: "ARPU", value: formatSek(m.arpu) },
    {
      label: "Churn (≈, 30d)",
      value: `${(m.churnApprox * 100).toFixed(1)} %`,
    },
    {
      label: "LTV (≈)",
      value: m.ltvApprox == null ? "-" : formatSek(m.ltvApprox),
    },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Översikt" />
      <StatGrid items={cards.slice(0, 4)} />
      <StatGrid items={cards.slice(4)} />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Churn och LTV är approximationer baserade på avbokningshändelser de senaste 30 dagarna
        (ingen historisk MRR lagras ännu).
      </p>
    </div>
  );
}
