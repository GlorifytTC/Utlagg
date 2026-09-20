"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { UpsellCard } from "@/components/UpsellCard";
import { PendingReceiptsInbox } from "@/components/dashboard/PendingReceiptsInbox";

interface Req {
  id: string;
  amount: string;
  status: string;
  requesterComment: string | null;
  createdAt: string;
}

export default function ApprovalsPage() {
  const { t } = useLanguage();
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
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold text-gray-900 dark:text-white">{t.navApprovals}</h1>
        <UpsellCard title={t.navApprovals} requiredPlan="Företag" description={t.apUpsellDesc} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold text-gray-900 dark:text-white">{t.navApprovals}</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/approvals/submit"><Button variant="outline">{t.btnSubmitApproval}</Button></Link>
          <Link href="/dashboard/approvals/history"><Button variant="outline">{t.btnHistory}</Button></Link>
        </div>
      </div>

      <PendingReceiptsInbox />

      <Card>
        <CardHeader>
          <CardTitle>{t.apWaiting}</CardTitle>
          <CardDescription>{t.apWaitingDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-500">{t.apNoneWaiting}</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-white/[0.07]">
              {pending.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{Number(r.amount).toFixed(2).replace(".", ",")} kr</p>
                    {r.requesterComment && <p className="text-sm text-gray-500">{r.requesterComment}</p>}
                    <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("sv-SE")}</p>
                  </div>
                  {commenting?.id === r.id ? (
                    <div className="flex flex-col gap-2 w-full">
                      <input
                        autoFocus
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
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
