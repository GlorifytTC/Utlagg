"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (password !== confirm) {
      setError("Lösenorden matchar inte");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/login?reset=success");
    } else {
      const e = await res.json().catch(() => ({}));
      setError(e.message ?? "Kunde inte återställa lösenordet");
    }
  }

  if (!token) {
    return <p className="mt-6 text-sm text-red-600">Ogiltig eller saknad länk.</p>;
  }

  return (
    <div className="mt-6 space-y-4">
      <input
        type="password"
        placeholder="Nytt lösenord"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none focus:border-nordic-600"
      />
      <input
        type="password"
        placeholder="Bekräfta lösenord"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none focus:border-nordic-600"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={submit}
        disabled={loading || !password}
        className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-nordic-900 disabled:opacity-60"
      >
        {loading ? "Sparar…" : "Spara nytt lösenord"}
      </button>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-xl font-semibold">
          Utlagg
        </Link>
        <h1 className="mt-8 font-display text-3xl">Återställ lösenord</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-ink/60">Laddar…</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </main>
  );
}
