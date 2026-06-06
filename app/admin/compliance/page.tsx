import { retentionReport } from "@/lib/compliance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin · Efterlevnad" };
export const dynamic = "force-dynamic";

const subprocessors = [
  ["Railway", "Hosting + PostgreSQL", "EU"],
  ["Cloudflare R2", "Kvittobilder", "EU"],
  ["Stripe", "Betalningar", "EU/US (SCC)"],
  ["Resend", "E-post", "US (SCC)"],
  ["Upstash", "Redis/QStash", "EU"],
  ["Google Cloud Vision", "OCR", "EU/US (SCC)"],
];

export default async function AdminCompliance() {
  const retention = await retentionReport();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Efterlevnad</h1>

      <Card>
        <CardHeader>
          <CardTitle>Skatteverket-export</CardTitle>
          <CardDescription>Alla kvitton med momsuppdelning (CSV) för ett datumintervall</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="GET" action="/api/admin/compliance/skatteverket" className="flex flex-wrap items-end gap-2">
            <label className="text-sm">Från<br /><input type="date" name="from" className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-950" /></label>
            <label className="text-sm">Till<br /><input type="date" name="to" className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-950" /></label>
            <Button type="submit" variant="outline">Ladda ner CSV</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GDPR — Subject Access Request</CardTitle>
          <CardDescription>Exportera all data för en användare som JSON</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Öppna en användare under <span className="font-medium">Användare</span> och hämta
            <code className="mx-1">/api/admin/compliance/sar/&lt;id&gt;</code> (admin-skyddad).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7-årsretention (Bokföringslagen)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>Brytpunkt: {new Date(retention.cutoff).toLocaleDateString("sv-SE")}</p>
          <p>Revisionsposter äldre än 7 år: {retention.recordsOlderThan7y}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Underbiträden</CardTitle>
          <CardDescription>Tjänster som behandlar persondata</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {subprocessors.map(([n, p, r]) => (
                <tr key={n}><td className="py-2 font-medium">{n}</td><td className="py-2">{p}</td><td className="py-2 text-gray-500">{r}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-gray-400">
            Detta är en teknisk översikt, inte juridisk rådgivning. DPA-text och dataregister bör granskas av jurist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
