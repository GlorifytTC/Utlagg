import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { ExportPanel } from "@/components/dashboard/ExportPanel";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const metadata = { title: "Exportera" };
export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const t = getT();

  return (
    <div className="space-y-6">
      <PageHeader title={t.navExport} description={t.pdExport} />
      <ExportPanel />
    </div>
  );
}
