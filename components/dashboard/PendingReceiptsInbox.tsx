"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

interface PendingReceipt {
  id: string;
  vendorName: string | null;
  totalAmount: string | null;
  vatAmount: string | null;
  vatRate: number | null;
  date: string | null;
  category: string | null;
  imageUrl: string | null;
  receiptNumber: string | null;
  createdAt: string;
  uploaderName: string | null;
  uploaderEmail: string | null;
}

function money(v: string | null): string {
  if (v == null) return "—";
  return `${Number(v).toFixed(2).replace(".", ",")} kr`;
}

/**
 * "Awaiting your approval" — where an owner/admin sees every bill a member
 * uploaded that's still pending. Expand to see details (image + fields),
 * then approve it (into the dashboard) or remove it (reject).
 */
export function PendingReceiptsInbox() {
  const { t } = useLanguage();
  const [items, setItems] = useState<PendingReceipt[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/receipts/pending");
      if (res.ok) setItems((await res.json()).pending ?? []);
    } finally {
      setLoaded(true);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function decide(id: string, decision: "approve" | "remove") {
    setBusy(id);
    const res = await fetch(`/api/receipts/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success(decision === "approve" ? t.apReceiptApproved : t.apReceiptRemoved);
      setItems((prev) => prev.filter((r) => r.id !== id));
    } else {
      toast.error(t.toastDecisionFail);
    }
  }

  // Hidden entirely for non-approvers (API returns empty), and when empty.
  if (loaded && items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.apInboxTitle}</CardTitle>
        <CardDescription>{t.apInboxDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <p className="text-sm text-gray-500">…</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.07]">
            {items.map((r) => {
              const open = openId === r.id;
              return (
                <li key={r.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button className="flex-1 text-left" onClick={() => setOpenId(open ? null : r.id)}>
                      <p className="font-medium">
                        {r.vendorName || t.apUnknownVendor} · {money(r.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t.apFrom} {r.uploaderName || r.uploaderEmail || "—"}
                        {r.date ? ` · ${new Date(r.date).toLocaleDateString("sv-SE")}` : ""}
                      </p>
                    </button>
                    <div className="flex gap-2">
                      <Button disabled={busy === r.id} onClick={() => decide(r.id, "approve")}>
                        {t.btnApprove}
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={busy === r.id}
                        onClick={() => decide(r.id, "remove")}
                      >
                        {t.btnRemove}
                      </Button>
                    </div>
                  </div>

                  {open && (
                    <div className="mt-3 grid gap-4 rounded-lg bg-gray-50 p-4 dark:bg-white/[0.03] sm:grid-cols-[1fr_auto]">
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <dt className="text-gray-500">{t.apDetailVendor}</dt>
                        <dd>{r.vendorName || "—"}</dd>
                        <dt className="text-gray-500">{t.apDetailTotal}</dt>
                        <dd>{money(r.totalAmount)}</dd>
                        <dt className="text-gray-500">{t.apDetailVat}</dt>
                        <dd>
                          {money(r.vatAmount)}
                          {r.vatRate ? ` (${r.vatRate}%)` : ""}
                        </dd>
                        <dt className="text-gray-500">{t.apDetailDate}</dt>
                        <dd>{r.date ? new Date(r.date).toLocaleDateString("sv-SE") : "—"}</dd>
                        <dt className="text-gray-500">{t.apDetailCategory}</dt>
                        <dd>{r.category || "—"}</dd>
                        <dt className="text-gray-500">{t.apDetailNumber}</dt>
                        <dd>{r.receiptNumber || "—"}</dd>
                      </dl>
                      {r.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.imageUrl}
                          alt={r.vendorName || "kvitto"}
                          className="max-h-56 rounded-lg border border-gray-200 object-contain dark:border-white/10"
                        />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
