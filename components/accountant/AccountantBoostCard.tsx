"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BoostState {
  active: boolean;
  expiresAt: string | null;
  daysLeft: number | null;
}

/**
 * Boost card. Reads authoritative state from GET /api/accountant/boost and
 * starts payment via POST (→ Stripe Checkout URL → redirect). Boost is NEVER
 * activated by the browser or the success URL — only the verified webhook does
 * that; on return from Checkout we just poll the server state.
 */
export function AccountantBoostCard() {
  const params = useSearchParams();
  const [state, setState] = useState<BoostState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/accountant/boost");
      if (res.ok) setState(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Returned from Stripe: show a processing note and poll a few times for the
  // webhook to land — without ever claiming active before the server says so.
  useEffect(() => {
    if (params.get("boost") === "processing") {
      toast.info("Betalningen behandlas…");
      let tries = 0;
      const iv = setInterval(async () => {
        tries++;
        const res = await fetch("/api/accountant/boost");
        if (res.ok) {
          const s = await res.json();
          setState(s);
          if (s.active || tries >= 5) clearInterval(iv);
        }
      }, 2000);
      return () => clearInterval(iv);
    }
    if (params.get("boost") === "cancelled") toast.info("Köpet avbröts.");
  }, [params]);

  async function buy() {
    setBusy(true);
    try {
      const res = await fetch("/api/accountant/boost", { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.url) {
        window.location.href = d.url; // → Stripe Checkout
        return;
      }
      if (res.status === 409 && d.alreadyActive) {
        toast.info("Du har redan en aktiv boost.");
        load();
      } else {
        toast.error(d.error ?? "Kunde inte starta köp");
      }
    } catch {
      toast.error("Kunde inte starta köp");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  if (state?.active) {
    const until = state.expiresAt
      ? new Date(state.expiresAt).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" })
      : null;
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Boostad</CardTitle>
            <Badge className="bg-nordic-600 text-white">Aktiv</Badge>
          </div>
          <CardDescription>Din profil får ökad synlighet bland relevanta företag.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink/70">
            Aktiv till: <span className="font-medium text-ink">{until ?? "—"}</span>
            {state.daysLeft != null && (
              <span className="text-ink/50"> · {state.daysLeft} dagar kvar</span>
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Boosta din synlighet</CardTitle>
        <CardDescription>
          Få fler möjligheter att bli hittad av företag som söker revisor.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink/70">
          <span className="text-lg font-semibold text-ink">49 kr</span> · 7 dagar · engångsbetalning
        </p>
        <Button onClick={buy} disabled={busy}>
          {busy ? "Öppnar…" : "Boosta min profil"}
        </Button>
      </CardContent>
    </Card>
  );
}
