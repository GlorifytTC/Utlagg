"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Minimal accept page for an accountant invitation. Reads ?token=, posts to
 * the accept endpoint, and handles the three outcomes: success, needs-company
 * (client must create a company first, then we retry), and error. This is the
 * only UI in scope for the invitation flow — no dashboard beyond this.
 */
function AccountantAcceptInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [state, setState] = useState<
    "working" | "done" | "needsCompany" | "error" | "notoken"
  >("working");
  const [message, setMessage] = useState<string>("");
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);

  const accept = useCallback(async () => {
    if (!token) {
      setState("notoken");
      return;
    }
    setState("working");
    try {
      const res = await fetch("/api/accountant/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setState("done");
        return;
      }
      if (res.status === 401) {
        // Not signed in — send them to login and back here afterwards.
        router.push(`/login?next=${encodeURIComponent(`/accountant/accept?token=${token}`)}`);
        return;
      }
      if (res.status === 409 && data?.needsCompany) {
        setState("needsCompany");
        return;
      }
      setState("error");
      setMessage(data?.error ?? "Något gick fel.");
    } catch {
      setState("error");
      setMessage("Något gick fel.");
    }
  }, [token, router]);

  useEffect(() => {
    accept();
  }, [accept]);

  async function createCompanyThenRetry() {
    if (!companyName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyName.trim() }),
      });
      if (res.ok) {
        await accept(); // retry with the same token
      } else {
        const d = await res.json().catch(() => ({}));
        setState("error");
        setMessage(d?.error ?? "Kunde inte skapa företaget.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      {state === "working" && <p className="text-ink/70">Behandlar inbjudan…</p>}

      {state === "notoken" && (
        <p className="text-ink/70">Ingen giltig inbjudningslänk hittades.</p>
      )}

      {state === "done" && (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Åtkomst beviljad</h1>
          <p className="text-ink/70">
            Redovisningskonsulten har nu åtkomst till ditt företags underlag. Du kan
            när som helst ta bort åtkomsten från dina företagsinställningar.
          </p>
        </div>
      )}

      {state === "needsCompany" && (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Skapa ditt företag först</h1>
          <p className="text-ink/70">
            För att ge en redovisningskonsult åtkomst behöver du först skapa ditt
            företag. Ange namnet nedan.
          </p>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Företagsnamn"
            className="w-full rounded-lg border border-ink/15 px-3 py-2"
          />
          <button
            onClick={createCompanyThenRetry}
            disabled={busy || !companyName.trim()}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper disabled:opacity-50"
          >
            {busy ? "Skapar…" : "Skapa företag och acceptera"}
          </button>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Det gick inte</h1>
          <p className="text-ink/70">{message}</p>
        </div>
      )}
    </div>
  );
}

export default function AccountantAcceptPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-ink/70">Laddar…</div>}>
      <AccountantAcceptInner />
    </Suspense>
  );
}
