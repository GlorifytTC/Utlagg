"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function AdminUserActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  type Action = { path: string; method: string; label: string; confirmText?: string; requireText?: string; redirectAfter?: boolean };
  const [pending, setPending] = useState<Action | null>(null);

  async function run({ path, method, label, redirectAfter }: Action) {
    setBusy(label);
    setMsg(null);
    try {
      const res = await fetch(path, { method });
      if (res.ok) {
        setMsg(`${label}: klart`);
        if (redirectAfter) router.push("/admin/users");
        else router.refresh();
      } else {
        const e = await res.json().catch(() => ({}));
        setMsg(`${label}: ${e.error ?? "misslyckades"}`);
      }
    } catch {
      setMsg(`${label}: misslyckades`);
    } finally {
      setBusy(null);
    }
  }

  const call = (a: Action) => (a.confirmText ? setPending(a) : run(a));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        disabled={busy !== null}
        onClick={() => call({ path: `/api/admin/users/${userId}/send-reset`, method: "POST", label: "Skicka lösenordsåterställning" })}
      >
        Skicka lösenordsåterställning
      </Button>
      <Button
        variant="outline"
        disabled={busy !== null}
        onClick={() => call({ path: `/api/admin/users/${userId}/cancel-subscription`, method: "POST", label: "Avsluta prenumeration", confirmText: "Avsluta användarens prenumeration vid periodens slut?" })}
      >
        Avsluta prenumeration
      </Button>
      <Button
        variant="destructive"
        disabled={busy !== null}
        onClick={() => call({ path: `/api/admin/users/${userId}`, method: "DELETE", label: "Radera konto", confirmText: "Radera detta konto permanent? Detta går inte att ångra.", requireText: "RADERA", redirectAfter: true })}
      >
        Radera konto
      </Button>
      {busy && <span role="status" className="text-sm text-gray-500 dark:text-gray-400">{busy}…</span>}
      {!busy && msg && <span role="status" className="text-sm text-gray-500 dark:text-gray-400">{msg}</span>}
      <ConfirmDialog
        open={pending !== null}
        title={pending?.label ?? ""}
        description={pending?.confirmText}
        confirmLabel={pending?.label ?? ""}
        cancelLabel="Avbryt"
        destructive
        requireText={pending?.requireText}
        requireLabel={pending?.requireText ? `Skriv ${pending.requireText} för att bekräfta` : undefined}
        onConfirm={() => {
          const a = pending!;
          setPending(null);
          run(a);
        }}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
