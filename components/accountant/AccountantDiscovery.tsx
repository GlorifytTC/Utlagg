"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CompanyRow {
  id: string;
  name: string;
  city: string | null;
  industry: string | null;
  description: string | null;
  logoUrl: string | null;
  myStatus: "pending" | "active" | "revoked" | null;
}

/**
 * "Companies looking for an accountant" — accountant-side discovery, bound to
 * GET /api/accountant/discover/companies. Sending a request uses
 * POST /api/accountant/connection-requests/company (reverse-direction; reuses
 * the existing lifecycle). Discovery grants no access; a company must accept.
 */
export function AccountantDiscovery({ compact = false }: { compact?: boolean }) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [busy, setBusy] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (city) p.set("city", city);
      if (compact) p.set("pageSize", "5");
      const res = await fetch(`/api/accountant/discover/companies?${p}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.companies ?? []);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, [q, city, compact]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(load, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [load]);

  async function request(companyId: string) {
    setBusy(companyId);
    try {
      const res = await fetch("/api/accountant/connection-requests/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(d.alreadyPending ? "Förfrågan väntar redan" : "Förfrågan skickad");
        setRows((prev) => prev.map((r) => (r.id === companyId ? { ...r, myStatus: "pending" } : r)));
      } else if (res.status === 409 && d.alreadyConnected) {
        toast.info("Redan kopplad");
        setRows((prev) => prev.map((r) => (r.id === companyId ? { ...r, myStatus: "active" } : r)));
      } else {
        toast.error(d.error ?? "Kunde inte skicka förfrågan");
      }
    } catch {
      toast.error("Kunde inte skicka förfrågan");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex flex-wrap gap-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sök företag…"
            className="flex-1 min-w-[180px]"
          />
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ort"
            className="w-40"
          />
        </div>
      )}

      {status === "loading" ? (
        <p className="text-sm text-ink/50">Laddar företag…</p>
      ) : status === "error" ? (
        <p className="text-sm text-red-600">Kunde inte ladda företag.</p>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-ink/60">
            Inga företag söker revisor just nu.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex h-full flex-col gap-2 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    {c.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.logoUrl}
                        alt={c.name}
                        className="h-10 w-10 shrink-0 rounded-lg border border-gray-200 object-contain dark:border-white/10"
                      />
                    )}
                    <div>
                      <p className="font-medium text-ink">{c.name}</p>
                      <p className="text-xs text-ink/50">
                        {[c.city, c.industry].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-nordic-600/10 text-nordic-700 dark:bg-nordic-400/10 dark:text-nordic-300">
                    Söker revisor
                  </Badge>
                </div>
                {c.description && (
                  <p className="line-clamp-3 text-sm text-ink/70">{c.description}</p>
                )}
                <div className="mt-auto pt-2">
                  {c.myStatus === "active" ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300">
                      Kopplad
                    </Badge>
                  ) : c.myStatus === "pending" ? (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                      Förfrågan skickad
                    </Badge>
                  ) : (
                    <Button disabled={busy === c.id} onClick={() => request(c.id)}>
                      {busy === c.id ? "Skickar…" : "Skicka förfrågan"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
