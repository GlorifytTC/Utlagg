"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AdminUserActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function call(path: string, method: string, label: string, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(label);
    setMsg(null);
    const res = await fetch(path, { method });
    const ok = res.ok;
    setBusy(null);
    setMsg(ok ? `${label}: klart` : `${label}: misslyckades`);
    if (ok && label === "Radera konto") router.push("/admin/users");
    else router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        disabled={busy !== null}
        onClick={() => call(`/api/admin/users/${userId}/send-reset`, "POST", "Skicka lösenordsåterställning")}
      >
        Skicka lösenordsåterställning
      </Button>
      <Button
        variant="outline"
        disabled={busy !== null}
        onClick={() => call(`/api/admin/users/${userId}/cancel-subscription`, "POST", "Avsluta prenumeration", "Avsluta användarens prenumeration vid periodens slut?")}
      >
        Avsluta prenumeration
      </Button>
      <Button
        variant="destructive"
        disabled={busy !== null}
        onClick={() => call(`/api/admin/users/${userId}`, "DELETE", "Radera konto", "Radera detta konto permanent? Detta går inte att ångra.")}
      >
        Radera konto
      </Button>
      {msg && <span className="text-sm text-gray-500">{msg}</span>}
    </div>
  );
}
