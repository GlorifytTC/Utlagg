import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AccountantProfile } from "@/components/marketplace/AccountantProfile";

export const dynamic = "force-dynamic";

export default async function AccountantProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  return (
    <div className="max-w-2xl">
      <AccountantProfile
        accountantId={id}
        viewerAccountantId={session.user.id}
        backHref="/accountant/marketplace"
      />
    </div>
  );
}
