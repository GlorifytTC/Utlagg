"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UpsellCard } from "@/components/UpsellCard";
import { useLanguage } from "@/context/LanguageContext";

interface Receipt { id: string; vendorName: string | null; totalAmount: string | null; }

export default function SubmitApprovalPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptId, setReceiptId] = useState("");
  const [approverEmail, setApproverEmail] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAllowed(d ? Boolean(d.features?.approvals) : false))
      .catch(() => setAllowed(false));
  }, []);

  useEffect(() => {
    fetch("/api/receipts").then(async (r) => {
      if (r.ok) setReceipts((await r.json()).receipts ?? []);
    });
  }, []);

  async function submit() {
    if (!receiptId || !approverEmail) { toast.error(t.toastSelectReceiptApprover); return; }
    setLoading(true);
    const res = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptId, approverEmail, requesterComment: comment }),
    });
    setLoading(false);
    if (res.ok) { toast.success(t.toastSubmitted); router.push("/dashboard/approvals/history"); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.error ?? t.toastSubmitFail); }
  }

  if (allowed === false) {
    return (
      <div className="max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.btnSubmitApproval}</h1>
        <UpsellCard
          title={t.apUpsellTitle}
          requiredPlan="Företag"
          description={t.apUpsellDesc}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.btnSubmitApproval}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t.apRequest}</CardTitle>
          <CardDescription>{t.apRequestDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receipt">{t.fldReceipt}</Label>
            <select id="receipt" value={receiptId} onChange={(e) => setReceiptId(e.target.value)} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-white/[0.10] dark:bg-[#111]">
              <option value="">{t.phSelectReceipt}</option>
              {receipts.map((r) => (
                <option key={r.id} value={r.id}>
                  {(r.vendorName ?? t.unknownShort)} — {Number(r.totalAmount ?? 0).toFixed(2).replace(".", ",")} kr
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="approver">{t.fldApproverEmail}</Label>
            <Input id="approver" type="email" value={approverEmail} onChange={(e) => setApproverEmail(e.target.value)} placeholder="chef@foretag.se" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">{t.fldComment}</Label>
            <Input id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t.phOptional} />
          </div>
          <Button onClick={submit} disabled={loading}>{loading ? t.stSubmitting : t.btnSubmitApproval}</Button>
        </CardContent>
      </Card>
      <p className="text-xs text-gray-400">
        {t.apSubmitNote}
      </p>
    </div>
  );
}
