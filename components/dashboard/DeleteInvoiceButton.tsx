"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  id: string;
  confirmText: string;
  label: string;
}

export function DeleteInvoiceButton({ id, confirmText, label }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(confirmText)) return;
    setLoading(true);
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      disabled={loading}
      onClick={handleDelete}
      className="px-2 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
    >
      {label}
    </Button>
  );
}
