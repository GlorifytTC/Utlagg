"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function FortnoxPanel({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function syncAll() {
    setBusy("sync");
    const res = await fetch("/api/integrations/fortnox/sync-all", { method: "POST" });
    setBusy(null);
    if (res.ok) {
      const d = await res.json();
      toast.success(`Synkat ${d.synced} kvitton${d.failed ? `, ${d.failed} misslyckades` : ""}`);
      router.refresh();
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? "Synk misslyckades");
    }
  }

  async function disconnect() {
    if (!confirm("Koppla bort Fortnox?")) return;
    setBusy("disc");
    const res = await fetch("/api/integrations/fortnox/disconnect", { method: "POST" });
    setBusy(null);
    if (res.ok) { toast.success("Frånkopplad"); router.refresh(); }
    else toast.error("Kunde inte koppla bort");
  }

  if (!connected) {
    return (
      <a href="/api/integrations/fortnox/auth">
        <Button>Anslut till Fortnox</Button>
      </a>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <span className="h-2 w-2 rounded-full bg-green-500" /> Ansluten
      </span>
      <Button onClick={syncAll} disabled={busy !== null}>
        {busy === "sync" ? "Synkar…" : "Synka nu"}
      </Button>
      <Button variant="outline" onClick={disconnect} disabled={busy !== null}>
        Koppla bort
      </Button>
    </div>
  );
}
