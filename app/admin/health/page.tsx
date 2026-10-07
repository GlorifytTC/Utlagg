import { checkAll } from "@/lib/health-checks";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Admin · Systemhälsa" };
export const dynamic = "force-dynamic";

const dot: Record<string, string> = {
  up: "bg-green-500",
  down: "bg-red-500",
  unconfigured: "bg-gray-400",
};
const labelFor: Record<string, string> = {
  up: "Uppe",
  down: "Nere",
  unconfigured: "Ej konfigurerad",
};

export default async function AdminHealth() {
  const checks = await checkAll();
  return (
    <div className="space-y-6">
      <PageHeader title="Systemhälsa" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((c) => (
          <Card key={c.name}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {labelFor[c.status]}
                  {c.latencyMs != null ? ` · ${c.latencyMs} ms` : ""}
                </p>
                {c.detail && <p className="text-xs text-red-600 dark:text-red-400">{c.detail}</p>}
              </div>
              <span aria-hidden className={`h-3 w-3 shrink-0 rounded-full ${dot[c.status]}`} />
              <span className="sr-only">{labelFor[c.status]}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Probes körs live vid sidladdning. Resend/Vision/QStash visar endast om de är
        konfigurerade (ingen billig health-endpoint finns).
      </p>
    </div>
  );
}
