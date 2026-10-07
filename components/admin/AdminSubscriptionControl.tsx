"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  userId: string;
  current: {
    tier: string;
    status: string;
    source: string | null;
    grantedUntil: string | null;
    paused: boolean;
    customSeats: number | null;
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
  const [seats, setSeats] = useState<string>(current.customSeats ? String(current.customSeats) : "");
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
      <div className="rounded-xl bg-gray-900/[0.04] p-3 text-sm dark:bg-white/[0.06]">
        <p>
          Nu: <strong>{current.tier}</strong> · {current.status}
          {current.source ? ` · ${current.source === "manual" ? "manuell (comp)" : current.source}` : ""}
          {current.paused ? " · PAUSAD" : ""}
          {current.grantedUntil
            ? new Date(current.grantedUntil).getTime() < Date.now()
              ? ` · UTGÅNGEN ${new Date(current.grantedUntil).toLocaleDateString("sv-SE")} - ingen aktiv plan`
              : ` · gäller t.o.m. ${new Date(current.grantedUntil).toLocaleDateString("sv-SE")}`
            : ""}
        </p>
        {current.grantedUntil &&
          new Date(current.grantedUntil).getTime() < Date.now() && (
            <p className="mt-1 text-amber-700 dark:text-amber-300">
              Den tilldelade planen har gått ut - användaren är nedgraderad till Free.
            </p>
          )}
        {!current.grantedUntil && current.tier === "free" && (
          <p className="mt-1 text-gray-500 dark:text-gray-400">Ingen aktiv plan.</p>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <Label htmlFor="sub-tier" className="mb-1 block !text-xs !font-normal text-gray-500 dark:text-gray-400">Plan</Label>
          <Select id="sub-tier" value={tier} onChange={(e) => setTier(e.target.value)} className="sm:!w-44">
            {TIERS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="sub-days" className="mb-1 block !text-xs !font-normal text-gray-500 dark:text-gray-400">Provdagar</Label>
          <Input id="sub-days" type="number" min="1" value={days} disabled={unlimited}
            onChange={(e) => setDays(e.target.value)} className="!w-24" />
        </div>
        <Checkbox checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} label="Obegränsat" />
        <Button
          disabled={busy !== null}
          onClick={() =>
            act("grant", { tier, ...(unlimited ? {} : { days: Number(days) || 30 }) })
          }
        >
          Ge / ändra prenumeration
        </Button>
      </div>

      {current.tier === "enterprise" && (
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label htmlFor="sub-seats" className="mb-1 block !text-xs !font-normal text-gray-500 dark:text-gray-400">Enterprise: antal användare (tomt = obegränsat)</Label>
            <Input id="sub-seats" type="number" min="1" value={seats} onChange={(e) => setSeats(e.target.value)} className="!w-32" />
          </div>
          <Button variant="outline" disabled={busy !== null}
            onClick={() => act("set_seats", { seats: Number(seats) > 0 ? Number(seats) : null })}>
            Spara platser
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {current.paused ? (
          <Button variant="outline" disabled={busy !== null} onClick={() => act("resume")}>Återuppta</Button>
        ) : (
          <Button variant="outline" disabled={busy !== null} onClick={() => act("pause")}>Pausa</Button>
        )}
        <Button variant="destructive" disabled={busy !== null} onClick={() => act("revoke")}>
          Återkalla (till gratis)
        </Button>
        {busy && <span role="status" className="self-center text-sm text-gray-500 dark:text-gray-400">Sparar…</span>}
        {!busy && msg && <span role="status" className="self-center text-sm text-gray-500 dark:text-gray-400">{msg}</span>}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        "Ge prenumeration" sätter planen direkt utan betalning (comp/test). Provdagar sätter
        ett utgångsdatum då den återgår till gratis. Pausa stänger av premiumåtkomst men
        behåller planen.
      </p>
    </div>
  );
}
