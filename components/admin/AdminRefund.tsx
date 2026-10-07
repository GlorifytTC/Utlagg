"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export interface AdminCharge {
  id: string;
  created: string; // ISO
  amountOre: number;
  refunded: boolean;
}

export function AdminRefund({ userId, charges }: { userId: string; charges: AdminCharge[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function refund(c: AdminCharge) {
    const sek = (c.amountOre / 100).toLocaleString("sv-SE");
    if (!confirm(`Återbetala ${sek} kr (${c.id})? Åtkomsten som köpet gav återkallas.`)) return;
    setBusy(c.id);
    setMsg(null);
    const res = await fetch(`/api/admin/users/${userId}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chargeId: c.id }),
    });
    setBusy(null);
    if (res.ok) {
      setMsg("Återbetalning skickad");
      router.refresh();
    } else {
      const e = await res.json().catch(() => ({}));
      setMsg(e.error ?? "Misslyckades");
    }
  }

  if (charges.length === 0) {
    return <p className="text-sm text-gray-500">Inga Stripe-betalningar.</p>;
  }
  return (
    <div className="space-y-2">
      <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
        {charges.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 py-2">
            <span>
              {new Date(c.created).toLocaleDateString("sv-SE")} ·{" "}
              {(c.amountOre / 100).toLocaleString("sv-SE")} kr ·{" "}
              <span className="font-mono text-xs">{c.id}</span>
            </span>
            {c.refunded ? (
              <span className="text-gray-500">Återbetald</span>
            ) : (
              <Button variant="destructive" disabled={busy !== null} onClick={() => refund(c)}>
                Återbetala
              </Button>
            )}
          </li>
        ))}
      </ul>
      {msg && <p className="text-sm text-gray-500">{msg}</p>}
      <p className="text-xs text-gray-400">
        Full återbetalning. Krediter nollställs, boost avbryts, prenumeration avslutas
        (om det är senaste fakturan). Delåterbetalning görs i Stripe och påverkar inte åtkomst.
      </p>
    </div>
  );
}
