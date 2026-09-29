import { CompanyAccountantAudit } from "@/components/dashboard/CompanyAccountantAudit";
import { getT } from "@/lib/i18n-server";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Revisorsaktivitet" };
export const dynamic = "force-dynamic";

export default function AccountantActivityPage() {
  const t = getT();
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={t.cauTitle}
        subtitle={t.cauPageDesc}
        back={{ href: "/dashboard/company", label: t.companySettings }}
      />

      <CompanyAccountantAudit />
    </div>
  );
}
