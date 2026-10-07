"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Field } from "@/components/auth/Field";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

// Cooldown between verification-email sends. Also armed right after signup so
// the button can't be hit instantly - gives the original mail time to arrive.
const RESEND_COOLDOWN = 30;

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="light-surface flex min-h-dvh items-center justify-center bg-paper px-6 py-12">
          <div className="w-full max-w-sm space-y-4" aria-hidden="true">
            <div className="skeleton h-8 w-32 rounded-lg" />
            <div className="skeleton h-11 w-full rounded-xl" />
            <div className="skeleton h-11 w-full rounded-xl" />
            <div className="skeleton h-11 w-full rounded-full" />
          </div>
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  // Renders a sentence with {email} highlighted in <strong>.
  const withEmail = (s: string, email: string) => {
    const [pre, post] = s.split("{email}");
    return <>{pre}<strong>{email}</strong>{post}</>;
  };
  const [form, setForm] = useState({ name: "", companyName: "", email: "", password: "" });
  const [accountType, setAccountType] = useState<"user" | "accountant">(
    searchParams.get("type") === "accountant" ? "accountant" : "user",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [emailFailed, setEmailFailed] = useState(false);
  // Inline "send it again" so someone who never got the mail can retry right
  // here, instead of being told to go hunt for a button on the login page.
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function resendVerification() {
    if (!sentTo || cooldown > 0 || resendState === "sending") return;
    setResendState("sending");
    try {
      const res = await fetch("/api/auth/resend-verification-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sentTo }),
      });
      if (res.ok) {
        setResendState("sent");
        setEmailFailed(false); // a successful resend clears the failure notice
        setCooldown(RESEND_COOLDOWN); // throttle client-side too; the API is rate-limited
      } else {
        setResendState("error");
      }
    } catch {
      setResendState("error");
    }
  }

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, accountType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.error);
        return;
      }
      // No auto sign-in: the account isn't active until the email link is
      // clicked, so we show a "check your inbox" screen instead.
      setEmailFailed(data.verificationEmailSent === false);
      setSentTo(form.email);
      // Arm the cooldown immediately so "skicka igen" can't be spammed before
      // the first email has had a chance to land.
      setCooldown(RESEND_COOLDOWN);
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <main className="light-surface flex min-h-dvh items-center justify-center bg-paper px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <Link href="/" className="inline-block rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
            <Logo size={28} wordmarkClassName="text-xl" adaptive={false} />
          </Link>
          <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">{t.regCheckInbox}</h1>
          {emailFailed ? (
            <>
              <p role="alert" className="mt-4 text-sm text-red-600">
                {withEmail(t.regEmailFailed, sentTo)}
              </p>
              <p className="mt-4 text-sm text-ink/70">
                {t.regEmailFailedHelpPre}{" "}
                <a href="mailto:support@kvittino.se" className="text-nordic-700 underline">
                  support@kvittino.se
                </a>{" "}
                {t.regEmailFailedHelpPost}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-ink/70">
              {withEmail(t.regSentTo, sentTo)}
            </p>
          )}

          {/* Resend, available in both cases - whether the first send failed
              outright or the mail simply never turned up. */}
          <div className="mt-6">
            <Button
              className="dark:!text-white"
              onClick={resendVerification}
              disabled={cooldown > 0 || resendState === "sending"}
            >
              {resendState === "sending"
                ? t.stSubmitting
                : cooldown > 0
                  ? t.regResendIn.replace("{n}", String(cooldown))
                  : t.regResend}
            </Button>
            {resendState === "sent" && cooldown > 0 && (
              <p role="status" className="mt-2 text-sm text-green-700">
                {withEmail(t.regResent, sentTo)}
              </p>
            )}
            {resendState === "error" && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {t.regResendError}
              </p>
            )}
          </div>
          <p className="mt-6 text-sm text-ink/65">
            {t.regNoMailPre}{" "}
            <Link href="/login" className="text-nordic-700 underline">
              {t.regNoMailLogin}
            </Link>{" "}
            {t.regNoMailPost}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="light-surface flex min-h-dvh items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
          <Logo size={28} wordmarkClassName="text-xl" adaptive={false} />
        </Link>
        <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">{t.authCreateAccount}</h1>
        <p className="mt-2 text-sm text-ink/65">
          {accountType === "accountant"
            ? t.regAccountantSubtitle
            : t.regUserSubtitle}
        </p>

        {/* Account type. The server derives isAccountant from this choice. */}
        <div className="mt-5 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
          <button
            type="button"
            aria-pressed={accountType === "user"}
            onClick={() => setAccountType("user")}
            className={
              "break-words rounded-lg border px-3 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 " +
              (accountType === "user"
                ? "border-ink bg-ink/[0.03]"
                : "hairline hover:border-ink/40")
            }
          >
            <span className="block font-medium text-ink">{t.regTypeUser}</span>
            <span className="mt-0.5 block text-xs text-ink/65">{t.regTypeUserDesc}</span>
          </button>
          <button
            type="button"
            aria-pressed={accountType === "accountant"}
            onClick={() => setAccountType("accountant")}
            className={
              "break-words rounded-lg border px-3 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 " +
              (accountType === "accountant"
                ? "border-ink bg-ink/[0.03]"
                : "hairline hover:border-ink/40")
            }
          >
            <span className="block font-medium text-ink">{t.regTypeAccountant}</span>
            <span className="mt-0.5 block text-xs text-ink/65">{t.regTypeAccountantDesc}</span>
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <Field id="reg-name" autoComplete="name" label={t.regName} value={form.name} onChange={update("name")} />
          <Field id="reg-company" autoComplete="organization" label={accountType === "accountant" ? t.regFirmOptional : t.regCompanyOptional} value={form.companyName} onChange={update("companyName")} />
          <Field id="reg-email" type="email" autoComplete="email" label={t.fldEmail} value={form.email} error={!!error} onChange={update("email")} />
          <Field id="reg-password" type="password" autoComplete="new-password" label={t.regPasswordHint} value={form.password} error={!!error}
            onChange={update("password")} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
          {error && <p id="form-error" role="alert" className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleSubmit} disabled={loading} className="w-full dark:!text-white">
            {loading ? t.regCreating : t.authCreateAccount}
          </Button>
        </div>
        <p className="mt-6 text-sm text-ink/65">
          {t.regHaveAccount}{" "}
          <Link href="/login" className="text-nordic-700 underline">{t.login}</Link>
        </p>
      </div>
    </main>
  );
}
