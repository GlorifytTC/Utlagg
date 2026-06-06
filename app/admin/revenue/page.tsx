import { computeMetrics, monthlySeries } from "@/lib/admin-metrics";
import { formatSek } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanPie, MonthlyBars } from "@/components/admin/RevenueCharts";

export const metadata = { title: "Admin · Intäkter" };
export const dynamic = "force-dynamic";

export default async function AdminRevenue() {
  const m = await computeMetrics();
  const { signups, receiptsByMonth } = await monthlySeries();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Intäkter</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "MRR", value: formatSek(m.mrr) },
          { label: "ARR", value: formatSek(m.arr) },
          { label: "Betalande", value: String(m.payingCustomers) },
          { label: "ARPU", value: formatSek(m.arpu) },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">{c.label}</p>
              <p className="text-2xl font-semibold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fördelning per plan</CardTitle>
            <CardDescription>Nuvarande aktiva konton</CardDescription>
          </CardHeader>
          <CardContent><PlanPie byTier={m.byTier} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nya användare per månad</CardTitle>
            <CardDescription>Faktiska registreringar</CardDescription>
          </CardHeader>
          <CardContent><MonthlyBars data={signups} label="Nya användare" /></CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Kvitton per månad</CardTitle>
            <CardDescription>Användningsvolym</CardDescription>
          </CardHeader>
          <CardContent><MonthlyBars data={receiptsByMonth} label="Kvitton" /></CardContent>
        </Card>
      </div>

      <p className="text-xs text-gray-400">
        MRR/ARR beräknas från nuvarande aktiva planer (Pro 149 kr, Företag 299 kr). En
        historisk MRR-kurva kräver att vi sparar månatliga ögonblicksbilder — det finns inte ännu.
      </p>
    </div>
  );
}
