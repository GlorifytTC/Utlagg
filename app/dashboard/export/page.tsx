import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { ExportPanel } from "@/components/dashboard/ExportPanel";

export const metadata = { title: "Exportera" };
export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const t = getT();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.navExport}</h1>
      </div>
      <ExportPanel />
    </div>
  );
}
