import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountantClientWorkspace } from "@/components/accountant/AccountantClientWorkspace";

export const metadata = { title: "Klient" };
export const dynamic = "force-dynamic";

export default async function AccountantClientPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  return (
    <div className="space-y-6">
      <Link
        href="/accountant"
        className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft size={16} /> Alla klienter
      </Link>
      <AccountantClientWorkspace companyId={params.id} currentUserId={session?.user?.id ?? ""} />
    </div>
  );
}
