"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface AccountantRow {
  id: string;
  name: string | null;
  email: string;
  logoUrl: string | null;
  city: string | null;
  bio: string | null;
  specializations: string[] | null;
  activeClientCount: number;
  isBoosted: boolean;
  myStatus: "pending" | "active" | "revoked" | null;
}

interface Props {
  /** If set, this is the viewer's own accountant id — their card gets a "Din profil" badge. */
  viewerAccountantId?: string;
  /** Compact mode — fewer results, no filter bar (for dashboard preview). */
  compact?: boolean;
}

export function AccountantMarketplace({ viewerAccountantId, compact = false }: Props) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [rows, setRows] = useState<AccountantRow[]>([]);
  const [canRequest, setCanRequest] = useState(false);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [busy, setBusy] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (city) p.set("city", city);
      if (specialization) p.set("specialization", specialization);
      if (compact) p.set("pageSize", "6");
      const res = await fetch(`/api/marketplace/accountants?${p}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.accountants ?? []);
      setCanRequest(data.viewerCanRequest ?? false);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, [q, city, specialization, compact]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(load, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [load]);

  async function sendRequest(accountantId: string) {
    setBusy(accountantId);
    try {
      const res = await fetch("/api/accountant/connection-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountantId }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(d.alreadyPending ? "Förfrågan väntar redan" : "Förfrågan skickad");
        setRows((prev) =>
          prev.map((r) => (r.id === accountantId ? { ...r, myStatus: "pending" } : r)),
        );
      } else if (res.status === 409 && d.alreadyConnected) {
        toast.info("Redan kopplad till denna revisor");
        setRows((prev) =>
          prev.map((r) => (r.id === accountantId ? { ...r, myStatus: "active" } : r)),
        );
      } else if (res.status === 409 && d.needsCompany) {
        toast.error("Skapa ett företag först");
      } else if (res.status === 403) {
        toast.error("Endast ägare/admin kan begära revisor");
      } else {
        toast.error(d.error ?? "Kunde inte skicka förfrågan");
      }
    } catch {
      toast.error("Kunde inte skicka förfrågan");
    } finally {
      setBusy(null);
    }
  }

  const inputClass =
    "min-w-[140px] flex-1 rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600";

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex flex-wrap gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sök revisor…"
            className={inputClass}
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ort"
            className="w-36 rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600"
          />
          <input
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="Bransch"
            className="w-40 rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600"
          />
        </div>
      )}

      {status === "loading" ? (
        <div className="flex items-center justify-center p-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
        </div>
      ) : status === "error" ? (
        <p className="text-sm text-red-600">Kunde inte ladda marknadsplatsen.</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-8 text-center text-sm text-gray-500 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D] dark:text-gray-400">
          Inga revisorer hittades.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((a, i) => {
            const isSelf = a.id === viewerAccountantId;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="relative flex flex-col rounded-2xl border border-gray-900/[0.07] bg-white/60 p-5 backdrop-blur-sm transition-shadow hover:shadow-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
              >
                {a.isBoosted && (
                  <span className="absolute right-4 top-4 rounded-full bg-nordic-600/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-nordic-600 dark:bg-nordic-600/20">
                    Boostad
                  </span>
                )}

                <div className="flex items-start gap-3">
                  {a.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.logoUrl}
                      alt={a.name ?? a.email}
                      className="h-10 w-10 shrink-0 rounded-lg border border-gray-900/[0.07] object-contain dark:border-white/[0.08]"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-nordic-600/10 text-sm font-semibold text-nordic-600">
                      {(a.name ?? a.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-semibold text-gray-900 dark:text-white">
                      {a.name ?? a.email}
                    </p>
                    {a.city && (
                      <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-gray-400">
                        {a.city}
                      </p>
                    )}
                  </div>
                </div>

                {a.specializations && a.specializations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.specializations.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-gray-900/[0.08] px-2.5 py-0.5 text-[11px] text-gray-500 dark:border-white/[0.08] dark:text-gray-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {a.bio && (
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {a.bio}
                  </p>
                )}

                {a.activeClientCount > 0 && (
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    {a.activeClientCount}+ klienter
                  </p>
                )}

                <div className="mt-auto pt-4">
                  {isSelf ? (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 dark:bg-white/[0.08] dark:text-gray-400">
                      Din profil
                    </span>
                  ) : a.myStatus === "active" ? (
                    <span className="rounded-full bg-green-100/50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                      Kopplad
                    </span>
                  ) : a.myStatus === "pending" ? (
                    <span className="rounded-full bg-amber-100/50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                      Förfrågan skickad
                    </span>
                  ) : canRequest ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={busy === a.id}
                      onClick={() => sendRequest(a.id)}
                      className="rounded-full bg-nordic-600 px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-nordic-700 disabled:opacity-60"
                    >
                      {busy === a.id ? "Skickar…" : "Skicka förfrågan"}
                    </motion.button>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
