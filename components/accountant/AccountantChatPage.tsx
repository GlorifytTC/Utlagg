"use client";

import { useCallback, useEffect, useState } from "react";
import { AccountantChat } from "@/components/AccountantChat";
import { ClientAvatar } from "@/components/accountant/ClientAvatar";

interface ClientDetail {
  clientId: string | null;
  companyName: string;
  logoUrl: string | null;
}

export function AccountantChatPage({
  companyId,
  currentUserId,
}: {
  companyId: string;
  currentUserId: string;
}) {
  const [detail, setDetail] = useState<ClientDetail | null | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/accountant/clients/${companyId}`);
      if (!res.ok) { setDetail(null); return; }
      const d = await res.json();
      setDetail({ clientId: d.clientId ?? null, companyName: d.companyName ?? "", logoUrl: d.logoUrl ?? null });
    } catch {
      setDetail(null);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  if (detail === undefined) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
      </div>
    );
  }

  if (!detail?.clientId) {
    return (
      <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-10 text-center backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
        <p className="text-sm text-gray-500 dark:text-gray-400">Chatt är inte tillgänglig för den här klienten.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ClientAvatar name={detail.companyName} logoUrl={detail.logoUrl} size="md" />
        <p className="font-display text-lg font-semibold text-gray-900 dark:text-white">{detail.companyName}</p>
      </div>
      <AccountantChat clientId={detail.clientId} currentUserId={currentUserId} />
    </div>
  );
}
