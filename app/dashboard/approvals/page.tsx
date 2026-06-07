"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Req {
  id: string;
  amount: string;
  status: string;
  requesterComment: string | null;
  createdAt: string;
}

export default function ApprovalsPage() {
  const [reqs, setReqs] = useState<Req[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/approvals?type=incoming");
    if (res.ok) setReqs((await res.json()).requests);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function decide(id: string, decision: "approved" | "rejected") {
    const comment = window.prompt(decision === "approved" ? "Kommentar (valfritt):" : "Skäl till avslag:") ?? "";
    setBusy(id);
    const res = await fetch(`/api/approvals/${id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, comment }),
    });
    setBusy(null);
    if (res.ok) { toast.success(decision === "approved" ? "Godkänd" : "Avslagen"); load(); }
    else toast.error("Kunde inte spara beslut");
  }

  const pending = reqs.filter((r) => r.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attest</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/approvals/submit"><Button variant="outline">Skicka för attest</Button></Link>
          <Link href="/dashboard/approvals/history"><Button variant="outline">Historik</Button></Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Väntar på ditt godkännande</CardTitle>
          <CardDescription>Förfrågningar adresserade till din e-post</CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-500">Inga väntande förfrågningar.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {pending.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{Number(r.amount).toFixed(2).replace(".", ",")} kr</p>
                    {r.requesterComment && <p className="text-sm text-gray-500">{r.requesterComment}</p>}
                    <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("sv-SE")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button disabled={busy === r.id} onClick={() => decide(r.id, "approved")}>Godkänn</Button>
                    <Button variant="destructive" disabled={busy === r.id} onClick={() => decide(r.id, "rejected")}>Avslå</Button>
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
