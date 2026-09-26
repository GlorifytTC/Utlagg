"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    const verify = searchParams.get("verify");
    if (verify === "success") setNotice(t.authVerifySuccess);
    else if (verify === "invalid") setError(t.authVerifyInvalid);
  }, [searchParams, t]);

  async function handleSubmit() {
    setError(null);
    setNotice(null);
    setUnverified(false);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      // NextAuth v4 collapses every authorize() failure into one generic
      // error, so ask separately why it failed before showing a message.
      try {
        const check = await fetch("/api/auth/check-verified", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }).then((r) => r.json());
        if (check.reason === "unverified") {
          setUnverified(true);
          setError(t.authMustVerify);
        } else if (check.reason === "banned") {
          setError(t.authBanned.replace("{date}", new Date(check.bannedUntil).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB")));
        } else {
          setError(t.authWrongCredentials);
        }
      } catch {
        setError(t.authWrongCredentials);
      }
      setLoading(false);
    } else {
      setLoading(false);
      router.push("/dashboard");
    }
  }

  async function handleResend() {
    setResendState("sending");
    try {
      const res = await fetch("/api/auth/resend-verification-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      await res.json().catch(() => null);
    } finally {
      setResendState("sent");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <Link href="/">
          <Logo size={28} wordmarkClassName="text-xl" adaptive={false} />
        </Link>
        <h1 className="mt-8 font-display text-3xl">{t.login}</h1>
        <div className="mt-6 space-y-4">
          <input
            type="email"
            placeholder={t.fldEmail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none transition focus-visible:border-nordic-600 focus-visible:ring-2 focus-visible:ring-nordic-600/30"
          />
          <input
            type="password"
            placeholder={t.authPassword}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none transition focus-visible:border-nordic-600 focus-visible:ring-2 focus-visible:ring-nordic-600/30"
          />
          {notice && !error && <p className="text-sm text-nordic-700">{notice}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {unverified && (
            <div className="rounded-lg bg-nordic-50 px-4 py-3 text-sm text-nordic-900">
              {resendState === "sent" ? (
                <p>{t.authResentTo.replace("{email}", email)}</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendState === "sending"}
                  className="underline disabled:opacity-60"
                >
                  {resendState === "sending" ? t.stSubmitting : t.authResend}
                </button>
              )}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition hover:bg-nordic-900 active:scale-[0.98] active:opacity-90 disabled:opacity-60"
          >
            {loading ? t.authLoggingIn : t.login}
          </button>
        </div>
        <p className="mt-6 text-sm text-ink/60">
          {t.authNoAccount}{" "}
          <Link href="/register" className="text-nordic-600 underline">
            {t.authCreateAccount}
          </Link>
        </p>
        <p className="mt-2 text-sm text-ink/60">
          <Link href="/forgot-password" className="text-nordic-600 underline">
            {t.authForgotPassword}
          </Link>
        </p>
      </div>
    </main>
  );
}
