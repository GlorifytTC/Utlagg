"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Minimal accept page for an accountant invitation. Reads ?token=, posts to
 * the accept endpoint, and handles the three outcomes: success, needs-company
 * (client must create a company first, then we retry), and error. This is the
 * only UI in scope for the invitation flow - no dashboard beyond this.
 */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="light-surface flex min-h-dvh items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/">
          <Logo size={28} wordmarkClassName="text-xl" adaptive={false} />
        </Link>
        <div className="panel mt-8 space-y-3 rounded-2xl p-6">{children}</div>
      </div>
    </main>
  );
}

function AccountantAcceptInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
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
        // Not signed in - send them to login and back here afterwards.
        router.push(`/login?next=${encodeURIComponent(`/accountant/accept?token=${token}`)}`);
        return;
      }
      if (res.status === 409 && data?.needsCompany) {
        setState("needsCompany");
        return;
      }
      setState("error");
      setMessage(data?.error ?? t.somethingWentWrong);
    } catch {
      setState("error");
      setMessage(t.somethingWentWrong);
    }
  }, [token, router, t]);

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
        setMessage(d?.error ?? t.accAcceptCreateCompanyError);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      {state === "working" && <p className="text-ink/70">{t.accAcceptWorking}</p>}

      {state === "notoken" && (
        <p className="text-ink/70">{t.accAcceptNoToken}</p>
      )}

      {state === "done" && (
        <div className="space-y-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{t.accAcceptDoneTitle}</h1>
          <p className="text-ink/70">
            {t.accAcceptDoneBody}
          </p>
        </div>
      )}

      {state === "needsCompany" && (
        <div className="space-y-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{t.accAcceptNeedsCompanyTitle}</h1>
          <p className="text-ink/70">
            {t.accAcceptNeedsCompanyBody}
          </p>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={t.fldCompanyName}
            className="w-full rounded-lg border hairline bg-white px-4 py-3 text-base outline-none transition focus-visible:border-nordic-600 focus-visible:ring-2 focus-visible:ring-nordic-600/30 sm:text-sm"
          />
          <button
            onClick={createCompanyThenRetry}
            disabled={busy || !companyName.trim()}
            className="w-full rounded-full bg-nordic-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-nordic-700 active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? t.accAcceptCreating : t.accAcceptCreateAndAccept}
          </button>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{t.accAcceptErrorTitle}</h1>
          <p className="text-ink/70">{message}</p>
        </div>
      )}
    </Shell>
  );
}

export default function AccountantAcceptPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<Shell><p className="text-ink/70">{t.loading}</p></Shell>}>
      <AccountantAcceptInner />
    </Suspense>
  );
}
