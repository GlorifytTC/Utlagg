"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UpsellCard } from "@/components/UpsellCard";
import { useLanguage } from "@/context/LanguageContext";
import { formatSek } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";

interface Receipt { id: string; vendorName: string | null; totalAmount: string | null; }

export default function SubmitApprovalPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptId, setReceiptId] = useState("");
  const [approverEmail, setApproverEmail] = useState("");
  const [approvers, setApprovers] = useState<{ email: string; name: string | null }[]>([]);
  const [taken, setTaken] = useState<Set<string>>(new Set());
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
    // Recent receipts for the approval dropdown (the list API paginates).
    fetch("/api/receipts?pageSize=100").then(async (r) => {
      if (r.ok) setReceipts((await r.json()).receipts ?? []);
    });
  }, []);

  useEffect(() => {
    fetch("/api/approvals?type=approvers").then(async (r) => {
      if (r.ok) setApprovers((await r.json()).approvers ?? []);
    });
    // Receipts that already have a pending/approved request can't be submitted again.
    fetch("/api/approvals?type=outgoing").then(async (r) => {
      if (!r.ok) return;
      const rows: { receiptId: string | null; status: string }[] = (await r.json()).requests ?? [];
      setTaken(new Set(rows.filter((x) => x.receiptId && x.status !== "rejected").map((x) => x.receiptId as string)));
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
    else toast.error(t.toastSubmitFail);
  }

  if (allowed === false) {
    return (
      <div className="max-w-3xl space-y-6">
        <PageHeader title={t.btnSubmitApproval} back={{ href: "/dashboard/approvals", label: t.navApprovals }} />
        <UpsellCard
          title={t.apUpsellTitle}
          requiredPlan={t.planBusiness}
          description={t.apUpsellDesc}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t.btnSubmitApproval} back={{ href: "/dashboard/approvals", label: t.navApprovals }} />
      <Card>
        <CardHeader>
          <CardTitle as="h2">{t.apRequest}</CardTitle>
          <CardDescription>{t.apRequestDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receipt">{t.fldReceipt}</Label>
            <Select id="receipt" value={receiptId} onChange={(e) => setReceiptId(e.target.value)}>
              <option value="">{t.phSelectReceipt}</option>
              {receipts.filter((r) => !taken.has(r.id)).map((r) => (
                <option key={r.id} value={r.id}>
                  {(r.vendorName ?? t.unknownShort)} - {formatSek(Number(r.totalAmount ?? 0))}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="approver">{t.fldApproverEmail}</Label>
            <Select id="approver" value={approverEmail} onChange={(e) => setApproverEmail(e.target.value)}>
              <option value="">{t.phSelectApprover}</option>
              {approvers.map((a) => (
                <option key={a.email} value={a.email}>{a.name ? `${a.name} (${a.email})` : a.email}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">{t.fldComment}</Label>
            <Input id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t.phOptional} />
          </div>
          <Button onClick={submit} disabled={loading}>{loading ? t.stSubmitting : t.btnSubmitApproval}</Button>
        </CardContent>
      </Card>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t.apSubmitNote}
      </p>
    </div>
  );
}
