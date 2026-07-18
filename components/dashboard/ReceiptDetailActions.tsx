"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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
    if (!confirm(t.receiptDeleteConfirm)) return;
    setBusy("delete");
    await fetch(`/api/receipts/${id}`, { method: "DELETE" });
    // Back to the list, which re-fetches the (now smaller) page on mount.
    router.push("/dashboard/receipts");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending" && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={approve}
          disabled={busy !== null}
          className={cn(
            "rounded-full border border-gray-900/[0.15] px-4 py-1.5 text-sm hover:border-emerald-400 hover:text-emerald-700 dark:border-white/[0.15]",
            busy && "opacity-50",
          )}
        >
          {busy === "approve" ? "…" : t.receiptApprove}
        </motion.button>
      )}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={remove}
        disabled={busy !== null}
        className={cn(
          "rounded-full border border-gray-900/[0.15] px-4 py-1.5 text-sm text-red-600 hover:border-red-400 dark:border-white/[0.15]",
          busy && "opacity-50",
        )}
      >
        {busy === "delete" ? "…" : t.receiptDelete}
      </motion.button>
    </div>
  );
}
