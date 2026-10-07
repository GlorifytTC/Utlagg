import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { assertExportAllowed } from "@/lib/billing/export-gating";
import { ExportPanel } from "@/components/dashboard/ExportPanel";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Exportera" };
export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const t = getT();
  // Display only - the export routes still enforce the gate server-side.
  const [sie, pdf] = await Promise.all([
    assertExportAllowed(session.user.id, "sie4"),
    assertExportAllowed(session.user.id, "premium_pdf"),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t.navExport} />
      <ExportPanel locked={{ sie: !sie.allowed, pdf: !pdf.allowed }} />
    </div>
  );
}
