"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Req { id: string; amount: string; status: string; approverEmail?: string; approverComment: string | null; createdAt: string; }

const badge: Record<string, string> = {
  pending: "text-amber",
  approved: "text-green-600 dark:text-green-400",
  rejected: "text-red-600 dark:text-red-400",
};

export default function ApprovalHistoryPage() {
  const [reqs, setReqs] = useState<Req[]>([]);
  useEffect(() => {
    fetch("/api/approvals?type=outgoing").then(async (r) => {
      if (r.ok) setReqs((await r.json()).requests);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attesthistorik</h1>
      <Card>
        <CardHeader><CardTitle>Dina skickade förfrågningar</CardTitle></CardHeader>
        <CardContent>
          {reqs.length === 0 ? (
            <p className="text-sm text-gray-500">Inga förfrågningar ännu.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {reqs.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{Number(r.amount).toFixed(2).replace(".", ",")} kr</p>
                    {r.approverComment && <p className="text-sm text-gray-500">{r.approverComment}</p>}
                    <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("sv-SE")}</p>
                  </div>
                  <span className={"text-sm font-medium " + (badge[r.status] ?? "")}>
                    {r.status === "pending" ? "Väntar" : r.status === "approved" ? "Godkänd" : "Avslagen"}
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
