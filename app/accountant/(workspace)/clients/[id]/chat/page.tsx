import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountantChatPage } from "@/components/accountant/AccountantChatPage";
import { getServerLang } from "@/lib/i18n-server";
import { accountantStrings } from "@/lib/accountant-i18n";

export const metadata = { title: "Chatt" };
export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const t = accountantStrings(getServerLang());
  return (
    <div className="space-y-6">
      <Link
        href={`/accountant/clients/${params.id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft size={16} /> {t.backToClient}
      </Link>
      <AccountantChatPage companyId={params.id} currentUserId={session?.user?.id ?? ""} />
    </div>
  );
}
