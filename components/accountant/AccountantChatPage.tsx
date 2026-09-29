"use client";

import { useCallback, useEffect, useState } from "react";
import { AccountantChat } from "@/components/AccountantChat";
import { ClientAvatar } from "@/components/accountant/ClientAvatar";
import { PageHeader } from "@/components/ui/page-header";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

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
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
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

  const back = { href: `/accountant/clients/${companyId}`, label: t.backToClient };

  if (detail === undefined) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="skeleton h-5 w-28 rounded-full" />
        <div className="flex items-center gap-4">
          <div className="skeleton h-11 w-11 rounded-full" />
          <div className="skeleton h-9 w-56 rounded-xl" />
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (!detail?.clientId) {
    return (
      <div className="space-y-6">
        <PageHeader title={t.chatTitle} back={back} />
        <div className="rounded-2xl panel p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.chatUnavailable}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        back={back}
        title={
          <span className="flex items-center gap-3">
            <span aria-hidden>
              <ClientAvatar name={detail.companyName} logoUrl={detail.logoUrl} size="md" />
            </span>
            <span className="min-w-0 truncate">{detail.companyName}</span>
          </span>
        }
      />
      <AccountantChat clientId={detail.clientId} currentUserId={currentUserId} />
    </div>
  );
}
