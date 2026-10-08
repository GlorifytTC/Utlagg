"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatSek } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { UpsellCard } from "@/components/UpsellCard";
import { PendingReceiptsInbox } from "@/components/dashboard/PendingReceiptsInbox";
import { PageHeader } from "@/components/ui/page-header";

interface Req {
  id: string;
  amount: string;
  status: string;
  requesterComment: string | null;
  createdAt: string;
}

export default function ApprovalsPage() {
  const { t, lang } = useLanguage();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [commenting, setCommenting] = useState<{id: string; decision: "approved" | "rejected"; comment: string} | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAllowed(d ? Boolean(d.features?.approvals) : false))
      .catch(() => setAllowed(false));
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/approvals?type=incoming");
    if (res.ok) setReqs((await res.json()).requests);
  }, []);
  useEffect(() => { if (allowed) load(); }, [load, allowed]);

  async function decide(id: string, decision: "approved" | "rejected", comment: string) {
    setBusy(id);
    const res = await fetch(`/api/approvals/${id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, comment }),
    });
    setBusy(null);
    if (res.ok) { toast.success(decision === "approved" ? t.toastApproved : t.toastRejected); load(); }
    else toast.error(t.toastDecisionFail);
  }

  const pending = reqs.filter((r) => r.status === "pending");

  if (allowed === false) {
    return (
      <div className="max-w-3xl space-y-6">
        <PageHeader title={t.navApprovals} />
        <UpsellCard title={t.navApprovals} requiredPlan={t.planBusiness} description={t.apUpsellDesc} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={t.navApprovals}
        actions={
          <>
            <Link href="/dashboard/approvals/history" className={buttonClass("outline")}>{t.btnHistory}</Link>
            <Link href="/dashboard/approvals/submit" className={buttonClass()}>{t.btnSubmitApproval}</Link>
          </>
        }
      />

      <PendingReceiptsInbox />

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t.apWaiting}</CardTitle>
          <CardDescription>{t.apWaitingDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.apNoneWaiting}</p>
          ) : (
            <ul className="divide-y divide-gray-900/[0.06] dark:divide-white/[0.07]">
              {pending.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium tabular-nums">{formatSek(r.amount)}</p>
                    {r.requesterComment && <p className="text-sm text-gray-500 dark:text-gray-400">{r.requesterComment}</p>}
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(r.createdAt, lang)}</p>
                  </div>
                  {commenting?.id === r.id ? (
                    <div className="flex flex-col gap-2 w-full">
                      <Input
                        autoFocus
                        aria-label={commenting.decision === "approved" ? t.promptComment : t.promptReason}
                        placeholder={commenting.decision === "approved" ? t.promptComment : t.promptReason}
                        value={commenting.comment}
                        onChange={(e) => setCommenting((s) => s && { ...s, comment: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { decide(r.id, commenting.decision, commenting.comment); setCommenting(null); }
                          if (e.key === "Escape") setCommenting(null);
                        }}
                      />
                      <div className="flex gap-2">
                        <Button disabled={busy === r.id} onClick={() => { decide(r.id, commenting.decision, commenting.comment); setCommenting(null); }}>
                          {commenting.decision === "approved" ? t.btnApprove : t.btnReject}
                        </Button>
                        <Button variant="outline" onClick={() => setCommenting(null)}>{t.btnCancel}</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button disabled={busy === r.id} onClick={() => setCommenting({id: r.id, decision: "approved", comment: ""})}>{t.btnApprove}</Button>
                      <Button variant="destructive" disabled={busy === r.id} onClick={() => setCommenting({id: r.id, decision: "rejected", comment: ""})}>{t.btnReject}</Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
