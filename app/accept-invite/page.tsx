"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

function AcceptInner() {
  const router = useRouter();
  const { t } = useLanguage();
  const token = useSearchParams().get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setStatus("loading");
    const r = await fetch("/api/company/accept", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
    });
    if (r.ok) router.push("/dashboard/company");
    else { const e = await r.json().catch(() => ({})); setError(e.error ?? t.aiAcceptError); setStatus("error"); }
  }

  if (!token) return <p className="mt-6 text-sm text-red-600">{t.aiInvalidLink}</p>;

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-ink/70">{t.aiIntro}</p>
      <button onClick={accept} disabled={status === "loading"}
        className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-nordic-900 disabled:opacity-60">
        {status === "loading" ? t.aiJoining : t.aiAccept}
      </button>
      {error && <p className="text-sm text-red-600">{error} — <Link href="/login" className="underline">{t.regNoMailLogin}</Link> {t.aiLoginFirst}</p>}
    </div>
  );
}

export default function AcceptInvitePage() {
  const { t } = useLanguage();
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-xl font-semibold">Kvittino</Link>
        <h1 className="mt-8 font-display text-3xl">{t.aiTitle}</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-ink/60">{t.loading}</p>}>
          <AcceptInner />
        </Suspense>
      </div>
    </main>
  );
}
