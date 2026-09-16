"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Search, MapPin, Briefcase, X } from "lucide-react";

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
  avgRating: number | null;
  reviewCount: number;
  myStatus: "pending" | "active" | "revoked" | null;
}

interface Props {
  viewerAccountantId?: string;
  compact?: boolean;
  profileBasePath?: string;
}

function StarRow({ rating, count }: { rating: number; count: number }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-amber-400 leading-none">
        {"★".repeat(full)}{"☆".repeat(5 - full)}
      </span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {rating.toFixed(1)}
      </span>
      <span className="text-xs text-gray-400">({count})</span>
    </span>
  );
}

function Avatar({ name, email, logoUrl, size = 56 }: {
  name: string | null;
  email: string;
  logoUrl: string | null;
  size?: number;
}) {
  const label = (name ?? email).charAt(0).toUpperCase();
  const sz = `h-${size === 56 ? 14 : 10} w-${size === 56 ? 14 : 10}`;
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name ?? email}
        className={`${sz} shrink-0 rounded-xl border border-gray-900/[0.07] object-contain dark:border-white/[0.08]`}
      />
    );
  }
  return (
    <div className={`${sz} flex shrink-0 items-center justify-center rounded-xl bg-nordic-600/10 font-bold text-nordic-600 ${size === 56 ? "text-xl" : "text-sm"}`}>
      {label}
    </div>
  );
}

export function AccountantMarketplace({
  viewerAccountantId,
  compact = false,
  profileBasePath = "/dashboard/marketplace",
}: Props) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [rows, setRows] = useState<AccountantRow[]>([]);
  const [canRequest, setCanRequest] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ok" | "error">("loading");
  const [busy, setBusy] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoadState("loading");
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
      setLoadState("ok");
    } catch {
      setLoadState("error");
    }
  }, [q, city, specialization, compact]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(load, 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
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
        setRows((prev) => prev.map((r) => r.id === accountantId ? { ...r, myStatus: "pending" } : r));
      } else if (res.status === 409 && d.alreadyConnected) {
        toast.info("Redan kopplad");
        setRows((prev) => prev.map((r) => r.id === accountantId ? { ...r, myStatus: "active" } : r));
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

  const hasFilters = !!(q || city || specialization);

  return (
    <div className="space-y-5">
      {/* Search + filters */}
      {!compact && (
        <div className="space-y-3">
          {/* Main search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Sök efter namn eller e-post…"
              className="w-full rounded-xl border border-gray-900/[0.12] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Secondary filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[140px] max-w-[200px]">
              <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" strokeWidth={2} />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ort"
                className="w-full rounded-lg border border-gray-900/[0.10] bg-white py-2 pl-8 pr-8 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.10] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600"
              />
              {city && (
                <button onClick={() => setCity("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="relative flex-1 min-w-[140px] max-w-[200px]">
              <Briefcase className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" strokeWidth={2} />
              <input
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Bransch"
                className="w-full rounded-lg border border-gray-900/[0.10] bg-white py-2 pl-8 pr-8 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.10] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600"
              />
              {specialization && (
                <button onClick={() => setSpecialization("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {hasFilters && (
              <button
                onClick={() => { setQ(""); setCity(""); setSpecialization(""); }}
                className="rounded-lg border border-gray-900/[0.10] px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 dark:border-white/[0.10] dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                Rensa filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results meta */}
      {!compact && loadState === "ok" && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {rows.length === 0
              ? "Inga revisorer hittades"
              : `${rows.length} revisor${rows.length === 1 ? "" : "er"} · rankat efter relevans`}
          </p>
        </div>
      )}

      {/* Results */}
      {loadState === "loading" ? (
        <div className="space-y-3">
          {[...Array(compact ? 3 : 5)].map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-gray-900/[0.07] bg-gray-100 dark:border-white/[0.06] dark:bg-white/[0.04]"
            />
          ))}
        </div>
      ) : loadState === "error" ? (
        <p className="text-sm text-red-600">Kunde inte ladda marknadsplatsen.</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 px-8 py-12 text-center backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inga revisorer hittades.</p>
          {hasFilters && (
            <button
              onClick={() => { setQ(""); setCity(""); setSpecialization(""); }}
              className="mt-2 text-sm text-nordic-600 hover:underline"
            >
              Rensa filter
            </button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {rows.map((a, i) => {
              const isSelf = a.id === viewerAccountantId;
              return (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className="group relative rounded-2xl border border-gray-900/[0.07] bg-white transition-all hover:border-gray-900/[0.14] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:border-white/[0.08] dark:bg-[#0D0D0D] dark:hover:border-white/[0.14] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                >
                  {/* Full-card link */}
                  <Link
                    href={`${profileBasePath}/${a.id}`}
                    className="absolute inset-0 rounded-2xl"
                    aria-label={`Visa profil för ${a.name ?? a.email}`}
                  />

                  <div className="flex items-start gap-4 p-5">
                    {/* Avatar */}
                    <Avatar name={a.name} email={a.email} logoUrl={a.logoUrl} size={56} />

                    {/* Body */}
                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Name row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-[15px] font-semibold text-gray-900 dark:text-white">
                          {a.name ?? a.email}
                        </span>
                        {a.isBoosted && (
                          <span className="rounded-full bg-nordic-600/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-nordic-600 dark:bg-nordic-600/20">
                            Boostad
                          </span>
                        )}
                        {isSelf && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-white/[0.08] dark:text-gray-400">
                            Din profil
                          </span>
                        )}
                      </div>

                      {/* Meta: city · specializations */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {a.city && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} />
                            {a.city}
                          </span>
                        )}
                        {a.specializations && a.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {a.specializations.slice(0, 4).map((s) => (
                              <span
                                key={s}
                                className="rounded-full bg-gray-100/80 px-2 py-0.5 text-[11px] text-gray-500 dark:bg-white/[0.07] dark:text-gray-400"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bio */}
                      {a.bio && (
                        <p className="line-clamp-1 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
                          {a.bio}
                        </p>
                      )}

                      {/* Stats row */}
                      <div className="flex flex-wrap items-center gap-3 pt-0.5">
                        {a.avgRating != null && a.reviewCount > 0 && (
                          <StarRow rating={a.avgRating} count={a.reviewCount} />
                        )}
                        {a.activeClientCount > 0 && (
                          <span className="text-xs text-gray-400">
                            {a.activeClientCount} klient{a.activeClientCount === 1 ? "" : "er"}
                          </span>
                        )}
                        {a.avgRating == null && a.activeClientCount === 0 && (
                          <span className="text-xs text-gray-300 dark:text-gray-600">Ny revisor</span>
                        )}
                      </div>
                    </div>

                    {/* Right: CTA */}
                    <div className="relative z-10 hidden shrink-0 items-center self-center sm:flex">
                      {a.myStatus === "active" ? (
                        <span className="rounded-full bg-green-100/60 px-3 py-1.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                          Kopplad
                        </span>
                      ) : a.myStatus === "pending" ? (
                        <span className="rounded-full bg-amber-100/60 px-3 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                          Förfrågan skickad
                        </span>
                      ) : !isSelf && canRequest ? (
                        <button
                          disabled={busy === a.id}
                          onClick={(e) => { e.preventDefault(); sendRequest(a.id); }}
                          className="rounded-full bg-nordic-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-nordic-700 disabled:opacity-60"
                        >
                          {busy === a.id ? "Skickar…" : "Skicka förfrågan"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Mobile CTA — below body */}
                  {!isSelf && (a.myStatus || canRequest) && (
                    <div className="relative z-10 border-t border-gray-900/[0.05] px-5 py-3 sm:hidden dark:border-white/[0.05]">
                      {a.myStatus === "active" ? (
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">Kopplad</span>
                      ) : a.myStatus === "pending" ? (
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Förfrågan skickad</span>
                      ) : canRequest ? (
                        <button
                          disabled={busy === a.id}
                          onClick={(e) => { e.preventDefault(); sendRequest(a.id); }}
                          className="text-xs font-medium text-nordic-600 hover:underline disabled:opacity-60"
                        >
                          {busy === a.id ? "Skickar…" : "Skicka förfrågan →"}
                        </button>
                      ) : null}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
