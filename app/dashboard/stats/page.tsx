import { metaTitle } from "@/lib/i18n-server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { StatsClient } from "@/components/dashboard/StatsClient";

export const generateMetadata = metaTitle("Statistik", "Statistics");
export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  return <StatsClient />;
}
