import { metaTitle } from "@/lib/i18n-server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ChatInbox } from "@/components/ChatInbox";

export const generateMetadata = metaTitle("Chattar", "Chats");
export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const session = await getServerSession(authOptions);
  return <ChatInbox role="company" currentUserId={session?.user?.id ?? ""} />;
}
