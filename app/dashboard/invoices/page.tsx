import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { customerInvoices } from "@/db/schema";
import { currentTier } from "@/lib/entitlements";
import { hasFeature } from "@/lib/features";
import { getUserCompany } from "@/lib/company";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpsellCard } from "@/components/UpsellCard";

export const metadata = { title: "Fakturor" };
export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const ctx = await currentTier();
  if (!ctx || !hasFeature(ctx.tier, "invoicing")) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fakturor</h1>
        <UpsellCard
          title="Fakturering"
          requiredPlan="Pro"
          description="Skapa och skicka kundfakturor (inkl. omvänd byggmoms) till dina kunder. Ingår från Pro-planen."
        />
      </div>
    );
  }

  const membership = await getUserCompany(session.user.id);
  if (!membership) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fakturor</h1>
        <Card>
          <CardHeader>
            <CardTitle>Skapa ett företag först</CardTitle>
            <CardDescription>Säljaruppgifterna (namn, organisationsnummer) på fakturan hämtas från ditt företag.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/company"><Button>Till företag</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rows = await db
    .select()
    .from(customerInvoices)
    .where(eq(customerInvoices.companyId, membership.companyId))
    .orderBy(desc(customerInvoices.issueDate));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fakturor</h1>
        <Link href="/dashboard/invoices/new"><Button>Ny faktura</Button></Link>
      </div>
      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">Inga fakturor ännu.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-gray-50 text-left text-gray-500 dark:bg-gray-900">
                  <tr><th className="px-4 py-3">Nr</th><th>Kund</th><th>Datum</th><th>Belopp</th><th>Moms</th><th></th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rows.map((r: Record<string, unknown>) => (
                    <tr key={r.id as string}>
                      <td className="px-4 py-3 font-medium">{r.invoiceNumber as string}</td>
                      <td>{r.buyerName as string}</td>
                      <td>{new Date(r.issueDate as string).toLocaleDateString("sv-SE")}</td>
                      <td>{Number(r.total).toFixed(2).replace(".", ",")} kr</td>
                      <td>{(r.reverseCharge as boolean) ? "Omvänd" : `${Number(r.vatTotal).toFixed(2).replace(".", ",")} kr`}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/dashboard/invoices/${r.id}`} className="text-nordic-600 underline">Visa</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-gray-400">
        Du ansvarar själv för att uppgifterna på fakturan är korrekta. Utlagg tillhandahåller
        mallen och sparar fakturan.
      </p>
    </div>
  );
}
