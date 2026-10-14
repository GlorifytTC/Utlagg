import { CompanyAccountantAudit } from "@/components/dashboard/CompanyAccountantAudit";
import { getT, metaTitle } from "@/lib/i18n-server";
import { PageHeader } from "@/components/ui/page-header";

export const generateMetadata = metaTitle("Revisorsaktivitet", "Accountant activity");
export const dynamic = "force-dynamic";

export default function AccountantActivityPage() {
  const t = getT();
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={t.cauTitle}
        subtitle={t.cauPageDesc}
        back={{ href: "/dashboard/settings/accountants", label: t.companySettings }}
      />

      <CompanyAccountantAudit />
    </div>
  );
}
