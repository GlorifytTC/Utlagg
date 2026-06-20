"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    const verify = searchParams.get("verify");
    if (verify === "success") setNotice("E-postadressen är bekräftad. Du kan nu logga in.");
    else if (verify === "invalid") setError("Länken är ogiltig eller har gått ut. Begär en ny nedan.");
  }, [searchParams]);

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
          setError("Du måste bekräfta din e-postadress innan du kan logga in.");
        } else {
          setError("Fel e-post eller lösenord");
        }
      } catch {
        setError("Fel e-post eller lösenord");
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
        <Link href="/" className="font-display text-xl font-semibold">
          Utlagg 
        </Link>
        <h1 className="mt-8 font-display text-3xl">Logga in</h1>
        <div className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none focus:border-nordic-600"
          />
          <input
            type="password"
            placeholder="Lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none focus:border-nordic-600"
          />
          {notice && !error && <p className="text-sm text-nordic-700">{notice}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {unverified && (
            <div className="rounded-lg bg-nordic-50 px-4 py-3 text-sm text-nordic-900">
              {resendState === "sent" ? (
                <p>Om kontot finns har vi skickat en ny bekräftelselänk till {email}.</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendState === "sending"}
                  className="underline disabled:opacity-60"
                >
                  {resendState === "sending" ? "Skickar…" : "Skicka bekräftelselänken igen"}
                </button>
              )}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-nordic-900 disabled:opacity-60"
          >
            {loading ? "Loggar in…" : "Logga in"}
          </button>
        </div>
        <p className="mt-6 text-sm text-ink/60">
          Inget konto?{" "}
          <Link href="/register" className="text-nordic-600 underline">
            Skapa konto
          </Link>
        </p>
        <p className="mt-2 text-sm text-ink/60">
          <Link href="/forgot-password" className="text-nordic-600 underline">
            Glömt lösenord?
          </Link>
        </p>
      </div>
    </main>
  );
}
