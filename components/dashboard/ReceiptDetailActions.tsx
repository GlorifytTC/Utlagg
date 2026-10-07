"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLanguage } from "@/context/LanguageContext";

export function ReceiptDetailActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState<null | "approve" | "delete">(null);
  const [confirming, setConfirming] = useState(false);

  async function approve() {
    setBusy("approve");
    await fetch(`/api/receipts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    router.refresh();
    setBusy(null);
  }

  async function remove() {
    setConfirming(false);
    setBusy("delete");
    await fetch(`/api/receipts/${id}`, { method: "DELETE" });
    // Back to the list, which re-fetches the (now smaller) page on mount.
    router.push("/dashboard/receipts");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending" && (
        <Button
          variant="outline"
          onClick={approve}
          disabled={busy !== null}
          className="hover:border-emerald-400 hover:text-emerald-700 dark:hover:border-emerald-400 dark:hover:text-emerald-300"
        >
          {busy === "approve" ? "…" : t.receiptApprove}
        </Button>
      )}
      <Button
        variant="outline"
        onClick={() => setConfirming(true)}
        disabled={busy !== null}
        className="text-red-600 hover:border-red-400 dark:text-red-400"
      >
        {busy === "delete" ? "…" : t.receiptDelete}
      </Button>
      <ConfirmDialog
        open={confirming}
        title={t.receiptDeleteTitle}
        description={t.receiptDeleteConfirm}
        confirmLabel={t.receiptDelete}
        cancelLabel={t.btnCancel}
        destructive
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
