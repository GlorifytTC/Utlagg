"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useSession } from "next-auth/react";

function AcceptInner() {
  const router = useRouter();
  const { t } = useLanguage();
  const token = useSearchParams().get("token") ?? "";
  const { status: authStatus } = useSession();
  const next = encodeURIComponent(`/accept-invite?token=${token}`);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setStatus("loading");
    setError(null);
    try {
      const r = await fetch("/api/company/accept", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
      });
      if (r.ok) router.push("/dashboard/settings/company");
      else { const e = await r.json().catch(() => ({})); setError(e.error ?? t.aiAcceptError); setStatus("error"); }
    } catch {
      setError(t.aiAcceptError);
      setStatus("error");
    }
  }

  if (!token)
    return (
      <div className="mt-6 space-y-3">
        <p role="alert" className="text-sm text-red-600">{t.aiInvalidLink}</p>
        <p className="text-sm">
          <Link href="/login" className="text-nordic-700 underline">{t.login}</Link>
          {" · "}
          <Link href="/contact" className="text-nordic-700 underline">{t.pricingContactUs}</Link>
        </p>
      </div>
    );

  // Not logged in: say so up front instead of failing on Accept.
  if (authStatus === "unauthenticated")
    return (
      <div className="mt-6 space-y-4">
        <p className="text-sm text-ink/70">{t.aiIntro}</p>
        <p className="text-sm text-ink/70">{t.aiNeedLogin}</p>
        <Link href={`/login?next=${next}`} className="block rounded-full bg-nordic-600 px-5 py-3 text-center text-sm font-medium text-white hover:bg-nordic-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">{t.login}</Link>
        <Link href="/register" className="block text-center text-sm text-nordic-700 underline">{t.authCreateAccount}</Link>
      </div>
    );

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-ink/70">{t.aiIntro}</p>
      <Button onClick={accept} disabled={status === "loading"} className="w-full dark:!text-white">
        {status === "loading" ? t.aiJoining : t.aiAccept}
      </Button>
      {error && <p role="alert" className="text-sm text-red-600">{error} - <Link href={`/login?next=${encodeURIComponent(`/accept-invite?token=${token}`)}`} className="underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">{t.regNoMailLogin}</Link> {t.aiLoginFirst}</p>}
    </div>
  );
}

export default function AcceptInvitePage() {
  const { t } = useLanguage();
  return (
    <main className="light-surface flex min-h-dvh items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
          <Logo size={28} wordmarkClassName="text-xl" adaptive={false} />
        </Link>
        <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">{t.aiTitle}</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-ink/65">{t.loading}</p>}>
          <AcceptInner />
        </Suspense>
      </div>
    </main>
  );
}
