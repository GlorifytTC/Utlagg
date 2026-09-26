"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

/**
 * Firm join page. The invitee lands here from the invite email. It validates
 * the token, greets them by name, lets them set a password, then joins the firm
 * and signs them in. No prior account/registration needed.
 */
function FirmJoinInner() {
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
      const res = await fetch(`/api/firm/accept-setup?token=${encodeURIComponent(token)}`);
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
      setError("Lösenordet måste vara minst 8 tecken.");
      return;
    }
    if (password !== confirm) {
      setError("Lösenorden matchar inte.");
      return;
    }
    setState("working");
    try {
      const res = await fetch("/api/firm/accept-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error ?? "Något gick fel.");
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
        router.push("/accountant");
      }
    } catch {
      setError("Något gick fel.");
      setState("form");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-xl font-semibold">
          Kvittino
        </Link>

        {state === "checking" && <p className="mt-6 text-sm text-ink/60">Laddar…</p>}

        {state === "invalid" && (
          <div className="mt-6 space-y-3">
            <h1 className="font-display text-2xl">Ogiltig länk</h1>
            <p className="text-sm text-ink/70">
              Inbjudningslänken är ogiltig eller har gått ut. Be den som bjöd in dig att
              skicka en ny.
            </p>
          </div>
        )}

        {state === "done" && (
          <div className="mt-6 space-y-3">
            <h1 className="font-display text-2xl">Välkommen!</h1>
            <p className="text-sm text-ink/70">
              Ditt konto är klart.{" "}
              <Link href="/accountant" className="underline">
                Gå till din arbetsyta
              </Link>
              .
            </p>
          </div>
        )}

        {(state === "form" || state === "working") && (
          <div className="mt-6 space-y-4">
            <h1 className="font-display text-2xl">Skapa ditt lösenord</h1>
            <p className="text-sm text-ink/70">
              {name ? `Hej ${name}! ` : ""}Du har bjudits in till en byrå på Kvittino. Välj ett
              lösenord för att komma igång.
            </p>
            <div>
              <label className="mb-1 block text-xs text-ink/50">E-post</label>
              <input
                value={email}
                disabled
                className="w-full rounded-lg border hairline bg-ink/[0.03] px-4 py-3 text-sm text-ink/60"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">Lösenord</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minst 8 tecken"
                className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none focus:border-nordic-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">Bekräfta lösenord</label>
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
              {state === "working" ? "Skapar…" : "Skapa konto och gå med"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function FirmJoinPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-paper px-6"><p className="text-sm text-ink/60">Laddar…</p></main>}>
      <FirmJoinInner />
    </Suspense>
  );
}
