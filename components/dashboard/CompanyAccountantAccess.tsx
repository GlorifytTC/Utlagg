"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import { MessageSquare, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountantChat } from "@/components/AccountantChat";
import { useLanguage } from "@/context/LanguageContext";
import { VerifiedBadge } from "@/components/VerifiedBadge";

interface AccountantRow {
  relationshipId: string;
  accountantId: string;
  name: string | null;
  email: string;
  status: string;
  connectedAt: string | null;
  isVerified: boolean;
}

/**
 * Company settings section listing accountants with ACTIVE access, with a
 * revoke action. Binds to GET /api/company/accountants and the existing
 * POST /api/company/accountants/[accountantId]/revoke. Matches the company
 * page's card/list/red-action styling.
 */
export function CompanyAccountantAccess() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [rows, setRows] = useState<AccountantRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState<string | null>(null); // relationshipId

  const [incoming, setIncoming] = useState<{ id: string; accountantId: string; requestedBy: string | null; name: string | null; email: string }[]>([]);

  const loadIncoming = useCallback(async () => {
    try {
      const res = await fetch("/api/company/accountant-requests");
      if (!res.ok) return;
      const d = await res.json();
      // Only requests the accountant sent can be answered here; ones we sent wait for the accountant.
      setIncoming((d.incoming ?? []).filter((r: { accountantId: string; requestedBy: string | null }) => r.requestedBy === r.accountantId));
    } catch {}
  }, []);

  async function respond(id: string, action: "accept" | "decline") {
    setBusy(id);
    try {
      const res = await fetch(`/api/company/accountant-requests/${id}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success(action === "accept" ? t.caaRequestAccepted : t.caaRequestDeclined);
      loadIncoming();
      load();
    } catch {
      toast.error(t.caaRequestError);
    } finally {
      setBusy(null);
    }
  }

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/company/accountants");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.accountants ?? []);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
    loadIncoming();
  }, [load, loadIncoming]);

  async function revoke(accountantId: string) {
    setBusy(accountantId);
    try {
      const res = await fetch(`/api/company/accountants/${accountantId}/revoke`, { method: "POST" });
      if (res.ok) {
        toast.success(t.caaRevoked);
        setRows((prev) => prev.filter((r) => r.accountantId !== accountantId));
        setConfirmId(null);
        load();
      } else {
        toast.error(t.caaRevokeError);
      }
    } catch {
      toast.error(t.caaRevokeError);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle as="h2">{t.caaTitle}</CardTitle>
            <CardDescription>{t.caaDesc}</CardDescription>
          </div>
          <Link
            href="/dashboard/accountant-activity"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-900/[0.10] px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-900/20 hover:text-gray-800 dark:border-white/[0.10] dark:text-gray-400 dark:hover:text-white"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {t.caaActivityLog}
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {incoming.length > 0 && (
          <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-3">
            <p className="mb-2 text-sm font-medium">{t.caaIncomingTitle}</p>
            <ul className="space-y-2">
              {incoming.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 break-words text-sm">
                    {r.name ?? r.email}
                    {r.name && <span className="block text-xs text-gray-500 dark:text-gray-400">{r.email}</span>}
                  </span>
                  <span className="flex gap-2">
                    <Button disabled={busy === r.id} onClick={() => respond(r.id, "accept")}>{t.caaAccept}</Button>
                    <Button variant="outline" disabled={busy === r.id} onClick={() => respond(r.id, "decline")}>{t.caaDecline}</Button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {status === "loading" ? (
          <p role="status" aria-busy="true" className="text-sm text-gray-500 dark:text-gray-400">{t.loading}</p>
        ) : status === "error" ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">{t.caaLoadError}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.caaEmpty}</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.07]">
            {rows.map((a) => (
              <li key={a.relationshipId} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 break-words">
                    <p className="flex flex-wrap items-center gap-1.5 font-medium">
                      {a.name ?? a.email}
                      {a.isVerified && <VerifiedBadge />}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{a.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setChatOpen(chatOpen === a.relationshipId ? null : a.relationshipId)}
                      aria-expanded={chatOpen === a.relationshipId}
                      className="flex min-h-11 items-center gap-1 text-sm text-gray-500 hover:text-gray-800 md:min-h-0 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <MessageSquare size={14} aria-hidden />
                      {t.caaChat}
                    </button>
                    {confirmId === a.accountantId ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t.caaConfirmRevoke}</span>
                        <Button
                          variant="destructive"
                          disabled={busy === a.accountantId}
                          onClick={() => revoke(a.accountantId)}
                        >
                          {busy === a.accountantId ? t.caaRemoving : t.caaYesRemove}
                        </Button>
                        <Button variant="outline" onClick={() => setConfirmId(null)}>
                          {t.btnCancel}
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(a.accountantId)}
                        className="min-h-11 text-sm text-red-600 hover:underline md:min-h-0 dark:text-red-400"
                      >
                        {t.caaRevoke}
                      </button>
                    )}
                  </div>
                </div>
                {chatOpen === a.relationshipId && session?.user?.id && (
                  <div className="mt-3">
                    <AccountantChat
                      clientId={a.relationshipId}
                      currentUserId={session.user.id}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
