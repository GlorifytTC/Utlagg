import { AccountantClientWorkspace } from "@/components/accountant/AccountantClientWorkspace";

export const metadata = { title: "Klient" };
export const dynamic = "force-dynamic";

export default function AccountantClientPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  return (
    <div className="max-w-6xl">
      <AccountantClientWorkspace companyId={params.id} initialTab={searchParams.tab} />
    </div>
  );
}
