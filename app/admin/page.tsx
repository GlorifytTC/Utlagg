import { computeMetrics } from "@/lib/admin-metrics";
import { formatSek } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Admin · Översikt" };
export const dynamic = "force-dynamic";

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
      value: m.ltvApprox == null ? "—" : formatSek(m.ltvApprox),
    },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Översikt</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">{c.label}</p>
              <p className="text-2xl font-semibold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Churn och LTV är approximationer baserade på avbokningshändelser de senaste 30 dagarna
        (ingen historisk MRR lagras ännu).
      </p>
    </div>
  );
}
