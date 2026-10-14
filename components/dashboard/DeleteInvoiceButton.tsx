"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  id: string;
  confirmText: string;
  label: string;
}

export function DeleteInvoiceButton({ id, confirmText, label }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setConfirming(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error(t.somethingWentWrong);
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        variant="ghost"
        disabled={loading}
        onClick={() => setConfirming(true)}
        className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
      >
        {label}
      </Button>
      <ConfirmDialog
        open={confirming}
        title={t.invDeleteTitle}
        description={confirmText}
        confirmLabel={label}
        cancelLabel={t.btnCancel}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
