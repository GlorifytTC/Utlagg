"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Review {
  id: string;
  companyName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface ProfileData {
  accountant: {
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
  };
  reviews: Review[];
  myStatus: string | null;
  viewerCanRequest: boolean;
  viewerCanReview: boolean;
  viewerExistingReview: { rating: number; comment: string | null } | null;
}

function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="text-amber-400" aria-label={`${rating} av ${max} stjärnor`}>
      {"★".repeat(Math.round(rating))}
      {"☆".repeat(max - Math.round(rating))}
    </span>
  );
}

interface Props {
  accountantId: string;
  /** If set and matches accountantId, shows inline profile editor. */
  viewerAccountantId?: string;
  /** Back-link href (e.g. "/dashboard/marketplace" or "/accountant/marketplace"). */
  backHref: string;
}

export function AccountantProfile({ accountantId, viewerAccountantId, backHref }: Props) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ok" | "error">("loading");
  const [busy, setBusy] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Inline edit state (accountant's own profile)
  const [editing, setEditing] = useState(false);
  const [editCity, setEditCity] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editSpecializations, setEditSpecializations] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const res = await fetch(`/api/marketplace/accountants/${accountantId}`);
      if (!res.ok) throw new Error();
      const d: ProfileData = await res.json();
      setData(d);
      setLoadState("ok");
      if (d.viewerExistingReview) {
        setReviewRating(d.viewerExistingReview.rating);
        setReviewComment(d.viewerExistingReview.comment ?? "");
      }
      setEditCity(d.accountant.city ?? "");
      setEditBio(d.accountant.bio ?? "");
      setEditSpecializations((d.accountant.specializations ?? []).join(", "));
    } catch {
      setLoadState("error");
    }
  }, [accountantId]);

  useEffect(() => { load(); }, [load]);

  async function sendRequest() {
    setBusy(true);
    try {
      const res = await fetch("/api/accountant/connection-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountantId }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(d.alreadyPending ? "Förfrågan väntar redan" : "Förfrågan skickad");
        setData((prev) => prev ? { ...prev, myStatus: "pending" } : prev);
      } else if (res.status === 409 && d.alreadyConnected) {
        toast.info("Redan kopplad");
        setData((prev) => prev ? { ...prev, myStatus: "active" } : prev);
      } else {
        toast.error(d.error ?? "Kunde inte skicka förfrågan");
      }
    } catch {
      toast.error("Kunde inte skicka förfrågan");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview() {
    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/marketplace/accountants/${accountantId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment || null }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Recension sparad");
        load();
      } else {
        toast.error(d.error ?? "Kunde inte spara recension");
      }
    } catch {
      toast.error("Kunde inte spara recension");
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function saveProfile() {
    setEditSaving(true);
    try {
      const specializations = editSpecializations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/marketplace/accountants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountantCity: editCity || null,
          accountantBio: editBio || null,
          accountantSpecializations: specializations.length ? specializations : null,
        }),
      });
      if (res.ok) {
        toast.success("Profil sparad");
        setEditing(false);
        load();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error ?? "Kunde inte spara");
      }
    } catch {
      toast.error("Kunde inte spara");
    } finally {
      setEditSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600";

  if (loadState === "loading") {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
      </div>
    );
  }
  if (loadState === "error" || !data) {
    return <p className="text-sm text-red-600">Kunde inte ladda profil.</p>;
  }

  const { accountant, reviews } = data;
  const isSelf = accountantId === viewerAccountantId;

  return (
    <div className="space-y-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white"
      >
        ← Tillbaka
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5 rounded-2xl border border-gray-900/[0.07] bg-white/60 p-6 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D] sm:flex-row sm:items-start"
      >
        {/* Avatar */}
        {accountant.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={accountant.logoUrl}
            alt={accountant.name ?? accountant.email}
            className="h-20 w-20 shrink-0 rounded-xl border border-gray-900/[0.07] object-contain dark:border-white/[0.08]"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-nordic-600/10 text-2xl font-bold text-nordic-600">
            {(accountant.name ?? accountant.email).charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
              {accountant.name ?? accountant.email}
            </h1>
            {accountant.isBoosted && (
              <span className="rounded-full bg-nordic-600/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-nordic-600 dark:bg-nordic-600/20">
                Boostad
              </span>
            )}
          </div>

          {accountant.city && (
            <p className="text-sm uppercase tracking-[0.12em] text-gray-400">{accountant.city}</p>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 pt-1 text-sm text-gray-500 dark:text-gray-400">
            {accountant.avgRating != null && (
              <span className="flex items-center gap-1">
                <Stars rating={accountant.avgRating} />
                <span>{accountant.avgRating.toFixed(1)}</span>
                <span className="text-gray-400">({accountant.reviewCount})</span>
              </span>
            )}
            {accountant.activeClientCount > 0 && (
              <span>{accountant.activeClientCount}+ klienter</span>
            )}
          </div>

          {accountant.specializations && accountant.specializations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {accountant.specializations.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-gray-900/[0.08] px-2.5 py-0.5 text-[11px] text-gray-500 dark:border-white/[0.08] dark:text-gray-400"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="shrink-0">
          {isSelf ? (
            <button
              onClick={() => setEditing((v) => !v)}
              className="rounded-full border border-gray-900/[0.12] px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-white/[0.12] dark:text-gray-300 dark:hover:bg-white/[0.06]"
            >
              {editing ? "Avbryt" : "Redigera profil"}
            </button>
          ) : data.myStatus === "active" ? (
            <span className="rounded-full bg-green-100/50 px-3 py-1.5 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
              Kopplad
            </span>
          ) : data.myStatus === "pending" ? (
            <span className="rounded-full bg-amber-100/50 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              Förfrågan skickad
            </span>
          ) : data.viewerCanRequest ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={busy}
              onClick={sendRequest}
              className="rounded-full bg-nordic-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-nordic-700 disabled:opacity-60"
            >
              {busy ? "Skickar…" : "Skicka förfrågan"}
            </motion.button>
          ) : null}
        </div>
      </motion.div>

      {/* Inline profile editor (own profile only) */}
      {isSelf && editing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-6 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Redigera profil</h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                Ort
              </label>
              <input
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                placeholder="Stockholm"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                Bio
              </label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={4}
                placeholder="Berätta om dig och din byrå…"
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                Specialiseringar (komma-separerade)
              </label>
              <input
                value={editSpecializations}
                onChange={(e) => setEditSpecializations(e.target.value)}
                placeholder="restaurang, bygg, IT"
                className={inputClass}
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={editSaving}
              className="rounded-full bg-nordic-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-nordic-700 disabled:opacity-60"
            >
              {editSaving ? "Sparar…" : "Spara"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Bio */}
      {accountant.bio && (
        <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-6 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Om</h2>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{accountant.bio}</p>
        </div>
      )}

      {/* Reviews */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recensioner
          {accountant.reviewCount > 0 && (
            <span className="ml-2 text-base font-normal text-gray-400">
              ({accountant.reviewCount})
            </span>
          )}
        </h2>

        {/* Submit / edit review form */}
        {data.viewerCanReview && (
          <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-5 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {data.viewerExistingReview ? "Din recension" : "Lämna en recension"}
            </p>
            <div className="space-y-3">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setReviewRating(n)}
                    className={`text-2xl transition-transform hover:scale-110 ${n <= reviewRating ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                placeholder="Valfri kommentar…"
                className={`${inputClass} resize-none`}
              />
              <button
                onClick={submitReview}
                disabled={reviewSubmitting}
                className="rounded-full bg-nordic-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-nordic-700 disabled:opacity-60"
              >
                {reviewSubmitting ? "Sparar…" : data.viewerExistingReview ? "Uppdatera" : "Skicka"}
              </button>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-8 text-center text-sm text-gray-500 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D] dark:text-gray-400">
            Inga recensioner ännu.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-5 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {r.companyName}
                    </p>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="shrink-0 text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("sv-SE")}
                  </p>
                </div>
                {r.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {r.comment}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
