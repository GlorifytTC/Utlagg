import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountantChatPage } from "@/components/accountant/AccountantChatPage";

export const metadata = { title: "Chatt" };
export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  return (
    <div className="max-w-6xl">
      <AccountantChatPage companyId={params.id} currentUserId={session?.user?.id ?? ""} />
    </div>
  );
}
