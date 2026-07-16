"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { UpsellCard } from "@/components/UpsellCard";
import { PendingReceiptsInbox } from "@/components/dashboard/PendingReceiptsInbox";
import { PageHeader } from "@/components/dashboard/PageHeader";

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

  async function decide(id: string, decision: "approved" | "rejected") {
    const comment = window.prompt(decision === "approved" ? t.promptComment : t.promptReason) ?? "";
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
        <PageHeader title={t.navApprovals} description={t.pdApprovals} />
        <UpsellCard title={t.navApprovals} requiredPlan="Företag" description={t.apUpsellDesc} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.navApprovals}
        description={t.pdApprovals}
        action={
          <div className="flex gap-2">
            <Link href="/dashboard/approvals/submit"><Button variant="outline">{t.btnSubmitApproval}</Button></Link>
            <Link href="/dashboard/approvals/history"><Button variant="outline">{t.btnHistory}</Button></Link>
          </div>
        }
      />

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
                  <div className="flex gap-2">
                    <Button disabled={busy === r.id} onClick={() => decide(r.id, "approved")}>{t.btnApprove}</Button>
                    <Button variant="destructive" disabled={busy === r.id} onClick={() => decide(r.id, "rejected")}>{t.btnReject}</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
