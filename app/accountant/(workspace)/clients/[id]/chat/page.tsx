import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountantChatPage } from "@/components/accountant/AccountantChatPage";

export const metadata = { title: "Chatt" };
export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  return (
    <div className="space-y-6">
      <Link
        href={`/accountant/clients/${params.id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft size={16} /> Tillbaka till klienten
      </Link>
      <AccountantChatPage companyId={params.id} currentUserId={session?.user?.id ?? ""} />
    </div>
  );
}
