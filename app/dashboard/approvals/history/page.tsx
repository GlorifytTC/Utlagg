"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatSek } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { PageHeader } from "@/components/ui/page-header";

interface Req { id: string; amount: string; status: string; approverEmail?: string; approverComment: string | null; createdAt: string; }

const badge: Record<string, string> = {
  pending: "text-amber",
  approved: "text-green-600 dark:text-green-400",
  rejected: "text-red-600 dark:text-red-400",
};

export default function ApprovalHistoryPage() {
  const { t, lang } = useLanguage();
  const [reqs, setReqs] = useState<Req[]>([]);
  useEffect(() => {
    fetch("/api/approvals?type=outgoing").then(async (r) => {
      if (r.ok) setReqs((await r.json()).requests);
    });
  }, []);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t.apHistoryTitle} back={{ href: "/dashboard/approvals", label: t.navApprovals }} />
      <Card>
        <CardHeader><CardTitle as="h2">{t.apHistoryDesc}</CardTitle></CardHeader>
        <CardContent>
          {reqs.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.apNoneYet}</p>
          ) : (
            <ul className="divide-y divide-gray-900/[0.06] dark:divide-white/[0.07]">
              {reqs.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium tabular-nums">{formatSek(r.amount)}</p>
                    {r.approverComment && <p className="text-sm text-gray-500 dark:text-gray-400">{r.approverComment}</p>}
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(r.createdAt, lang)}</p>
                  </div>
                  <span className={"text-sm font-medium " + (badge[r.status] ?? "")}>
                    {r.status === "pending" ? t.statusPending : r.status === "approved" ? t.statusApproved : t.statusRejected}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
