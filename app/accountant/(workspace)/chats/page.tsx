import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ChatInbox } from "@/components/ChatInbox";

export const metadata = { title: "Chattar" };
export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const session = await getServerSession(authOptions);
  return <ChatInbox role="accountant" currentUserId={session?.user?.id ?? ""} />;
}
