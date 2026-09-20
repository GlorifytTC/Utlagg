import { AccountantAllChats } from "@/components/accountant/AccountantAllChats";

export const metadata = { title: "Chattar" };
export const dynamic = "force-dynamic";

export default function ChatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-gray-900 dark:text-white">Chattar</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Senaste konversationer med dina klienter.</p>
      </div>
      <AccountantAllChats />
    </div>
  );
}
