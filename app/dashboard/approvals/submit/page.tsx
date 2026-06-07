"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Receipt { id: string; vendorName: string | null; totalAmount: string | null; }

export default function SubmitApprovalPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptId, setReceiptId] = useState("");
  const [approverEmail, setApproverEmail] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/receipts").then(async (r) => {
      if (r.ok) setReceipts((await r.json()).receipts ?? []);
    });
  }, []);

  async function submit() {
    if (!receiptId || !approverEmail) { toast.error("Välj kvitto och attestant"); return; }
    setLoading(true);
    const res = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptId, approverEmail, requesterComment: comment }),
    });
    setLoading(false);
    if (res.ok) { toast.success("Skickad för attest"); router.push("/dashboard/approvals/history"); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.error ?? "Kunde inte skicka"); }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Skicka för attest</h1>
      <Card>
        <CardHeader>
          <CardTitle>Förfrågan</CardTitle>
          <CardDescription>Välj ett kvitto och vem som ska godkänna</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receipt">Kvitto</Label>
            <select id="receipt" value={receiptId} onChange={(e) => setReceiptId(e.target.value)} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950">
              <option value="">Välj kvitto…</option>
              {receipts.map((r) => (
                <option key={r.id} value={r.id}>
                  {(r.vendorName ?? "Okänd")} — {Number(r.totalAmount ?? 0).toFixed(2).replace(".", ",")} kr
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="approver">Attestantens e-post</Label>
            <Input id="approver" type="email" value={approverEmail} onChange={(e) => setApproverEmail(e.target.value)} placeholder="chef@foretag.se" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Kommentar</Label>
            <Input id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Valfritt" />
          </div>
          <Button onClick={submit} disabled={loading}>{loading ? "Skickar…" : "Skicka för attest"}</Button>
        </CardContent>
      </Card>
      <p className="text-xs text-gray-400">
        Attestanten ser förfrågan när hen loggar in med ett konto som har den e-postadressen.
      </p>
    </div>
  );
}
