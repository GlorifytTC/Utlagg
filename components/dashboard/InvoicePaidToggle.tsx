"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  id: string;
  paid: boolean;
  /** "button" (default) for the detail page, "inline" for a compact list action. */
  variant?: "button" | "inline";
}

export function InvoicePaidToggle({ id, paid, variant = "button" }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: !paid }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={toggle}
        className="text-sm text-nordic-600 underline underline-offset-2 hover:text-nordic-700 disabled:opacity-50 dark:text-nordic-300"
      >
        {paid ? t.invMarkUnpaid : t.invMarkPaid}
      </button>
    );
  }

  return (
    <Button variant={paid ? "outline" : "default"} disabled={loading} onClick={toggle}>
      {paid ? t.invMarkUnpaid : t.invMarkPaid}
    </Button>
  );
}
