"use client";

import { useCallback, useEffect, useState } from "react";
import { AccountantChat } from "@/components/AccountantChat";

export function AccountantChatPage({
  companyId,
  currentUserId,
}: {
  companyId: string;
  currentUserId: string;
}) {
  const [clientId, setClientId] = useState<string | null | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/accountant/clients/${companyId}`);
      if (!res.ok) { setClientId(null); return; }
      const d = await res.json();
      setClientId(d.clientId ?? null);
    } catch {
      setClientId(null);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  if (clientId === undefined) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-10 text-center backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
        <p className="text-sm text-gray-500 dark:text-gray-400">Chatt är inte tillgänglig för den här klienten.</p>
      </div>
    );
  }

  return <AccountantChat clientId={clientId} currentUserId={currentUserId} />;
}
