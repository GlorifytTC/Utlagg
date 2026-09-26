"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Firm join page. The invitee lands here from the invite email. It validates
 * the token, greets them by name, lets them set a password, then joins the firm
 * and signs them in. No prior account/registration needed.
 */
function CompanyJoinInner() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [state, setState] = useState<"checking" | "form" | "invalid" | "done" | "working">("checking");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const validate = useCallback(async () => {
    if (!token) {
      setState("invalid");
      return;
    }
    try {
      const res = await fetch(`/api/company/accept-setup?token=${encodeURIComponent(token)}`);
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.valid) {
        setEmail(d.email ?? "");
        setName(d.name ?? "");
        setState("form");
      } else {
        setState("invalid");
      }
    } catch {
      setState("invalid");
    }
  }, [token]);

  useEffect(() => {
    validate();
  }, [validate]);

  async function submit() {
    setError("");
    if (password.length < 8) {
      setError(t.joinPwTooShort);
      return;
    }
    if (password !== confirm) {
      setError(t.rpMismatch);
      return;
    }
    setState("working");
    try {
      const res = await fetch("/api/company/accept-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error ?? t.somethingWentWrong);
        setState("form");
        return;
      }
      // Sign them in with the credentials they just set.
      const signInRes = await signIn("credentials", {
        email: d.email ?? email,
        password,
        redirect: false,
      });
      setState("done");
      if (signInRes?.ok) {
        router.push("/dashboard");
      }
    } catch {
      setError(t.somethingWentWrong);
      setState("form");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-xl font-semibold">
          Kvittino
        </Link>

        {state === "checking" && <p className="mt-6 text-sm text-ink/60">{t.loading}</p>}

        {state === "invalid" && (
          <div className="mt-6 space-y-3">
            <h1 className="font-display text-2xl">{t.joinInvalidTitle}</h1>
            <p className="text-sm text-ink/70">
              {t.joinInvalidBody}
            </p>
          </div>
        )}

        {state === "done" && (
          <div className="mt-6 space-y-3">
            <h1 className="font-display text-2xl">{t.joinWelcome}</h1>
            <p className="text-sm text-ink/70">
              {t.joinReady}{" "}
              <Link href="/dashboard" className="underline">
                {t.joinGoToWorkspace}
              </Link>
              .
            </p>
          </div>
        )}

        {(state === "form" || state === "working") && (
          <div className="mt-6 space-y-4">
            <h1 className="font-display text-2xl">{t.joinTitle}</h1>
            <p className="text-sm text-ink/70">
              {name ? t.joinGreeting.replace("{name}", name) : ""}{t.joinIntroCompany}
            </p>
            <div>
              <label className="mb-1 block text-xs text-ink/50">{t.fldEmail}</label>
              <input
                value={email}
                disabled
                className="w-full rounded-lg border hairline bg-ink/[0.03] px-4 py-3 text-sm text-ink/60"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">{t.authPassword}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.joinPwPlaceholder}
                className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none focus:border-nordic-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">{t.rpConfirmPassword}</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none focus:border-nordic-600"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={submit}
              disabled={state === "working"}
              className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-nordic-900 disabled:opacity-60"
            >
              {state === "working" ? t.accAcceptCreating : t.joinSubmit}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CompanyJoinPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-paper px-6"><p className="text-sm text-ink/60">{t.loading}</p></main>}>
      <CompanyJoinInner />
    </Suspense>
  );
}
