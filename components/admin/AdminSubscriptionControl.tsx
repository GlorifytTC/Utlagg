"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  userId: string;
  current: {
    tier: string;
    status: string;
    source: string | null;
    grantedUntil: string | null;
    paused: boolean;
  };
}

const TIERS = [
  { v: "free", label: "Gratis" },
  { v: "pro", label: "Pro" },
  { v: "business", label: "Företag" },
  { v: "enterprise", label: "Enterprise" },
];

export function AdminSubscriptionControl({ userId, current }: Props) {
  const router = useRouter();
  const [tier, setTier] = useState(current.tier === "free" ? "pro" : current.tier);
  const [days, setDays] = useState<string>("30");
  const [unlimited, setUnlimited] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function act(action: string, body: Record<string, unknown> = {}) {
    setBusy(action);
    setMsg(null);
    const res = await fetch(`/api/admin/users/${userId}/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    setBusy(null);
    if (res.ok) {
      setMsg("Klart");
      router.refresh();
    } else {
      const e = await res.json().catch(() => ({}));
      setMsg(e.error ?? "Misslyckades");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/[0.08]/50">
        <p>
          Nu: <strong>{current.tier}</strong> · {current.status}
          {current.source ? ` · ${current.source === "manual" ? "manuell (comp)" : current.source}` : ""}
          {current.paused ? " · PAUSAD" : ""}
          {current.grantedUntil ? ` · gäller t.o.m. ${new Date(current.grantedUntil).toLocaleDateString("sv-SE")}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Plan</label>
          <select value={tier} onChange={(e) => setTier(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-white/[0.10] dark:bg-[#111]">
            {TIERS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Provdagar</label>
          <input type="number" min="1" value={days} disabled={unlimited}
            onChange={(e) => setDays(e.target.value)}
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-white/[0.10] dark:bg-[#111]" />
        </div>
        <label className="flex items-center gap-1 pb-2 text-sm">
          <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} /> Obegränsat
        </label>
        <Button
          disabled={busy !== null}
          onClick={() =>
            act("grant", { tier, ...(unlimited ? {} : { days: Number(days) || 30 }) })
          }
        >
          Ge / ändra prenumeration
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {current.paused ? (
          <Button variant="outline" disabled={busy !== null} onClick={() => act("resume")}>Återuppta</Button>
        ) : (
          <Button variant="outline" disabled={busy !== null} onClick={() => act("pause")}>Pausa</Button>
        )}
        <Button variant="destructive" disabled={busy !== null} onClick={() => act("revoke")}>
          Återkalla (till gratis)
        </Button>
        {msg && <span className="self-center text-sm text-gray-500">{msg}</span>}
      </div>

      <p className="text-xs text-gray-400">
        "Ge prenumeration" sätter planen direkt utan betalning (comp/test). Provdagar sätter
        ett utgångsdatum då den återgår till gratis. Pausa stänger av premiumåtkomst men
        behåller planen.
      </p>
    </div>
  );
}
