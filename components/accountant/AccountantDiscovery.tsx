"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface CompanyRow {
  id: string;
  name: string;
  city: string | null;
  industry: string | null;
  description: string | null;
  logoUrl: string | null;
  myStatus: "pending" | "active" | "revoked" | null;
}

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
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sök företag…"
            className="min-w-[180px] flex-1 rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ort"
            className="w-40 rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600"
          />
        </div>
      )}

      {status === "loading" ? (
        <div className="flex items-center justify-center p-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
        </div>
      ) : status === "error" ? (
        <p className="text-sm text-red-600">Kunde inte ladda företag.</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-8 text-center text-sm text-gray-500 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D] dark:text-gray-400">
          Inga företag söker revisor just nu.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col rounded-2xl border border-gray-900/[0.07] bg-white/60 p-5 backdrop-blur-sm transition-shadow hover:shadow-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {c.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.logoUrl}
                      alt={c.name}
                      className="h-10 w-10 shrink-0 rounded-lg border border-gray-900/[0.07] object-contain dark:border-white/[0.08]"
                    />
                  )}
                  <div>
                    <p className="font-display text-base font-semibold text-gray-900 dark:text-white">
                      {c.name}
                    </p>
                    {(c.city || c.industry) && (
                      <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-nordic-600">
                        {[c.city, c.industry].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-nordic-600/10 px-2.5 py-1 text-xs font-medium text-nordic-600 dark:bg-nordic-600/20">
                  Söker revisor
                </span>
              </div>

              {c.description && (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {c.description}
                </p>
              )}

              <div className="mt-auto pt-4">
                {c.myStatus === "active" ? (
                  <span className="rounded-full bg-green-100/50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                    Kopplad
                  </span>
                ) : c.myStatus === "pending" ? (
                  <span className="rounded-full bg-amber-100/50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                    Förfrågan skickad
                  </span>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={busy === c.id}
                    onClick={() => request(c.id)}
                    className="rounded-full bg-nordic-600 px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-nordic-700 disabled:opacity-60"
                  >
                    {busy === c.id ? "Skickar…" : "Skicka förfrågan"}
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
