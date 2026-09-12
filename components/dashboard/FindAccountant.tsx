"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface DirectoryRow {
  id: string;
  name: string | null;
  email: string;
}
interface RequestRow {
  accountantId: string;
  status: "pending" | "active" | "revoked";
}

/**
 * "Find an accountant" — lets an owner/admin search the accountant directory
 * (GET /api/accountants/directory) and send a connection request via the
 * EXISTING POST /api/accountant/connection-requests { accountantId }. The
 * server resolves the company from the session and enforces owner/admin, so
 * no companyId is ever sent from the browser. Pending requests are shown so a
 * user can't double-request; an active accountant is shown as connected.
 *
 * This complements CompanyAccountantAccess (which lists + revokes active
 * accountants); it does not duplicate the revoke flow.
 */
export function FindAccountant() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<DirectoryRow[]>([]);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "error">("idle");
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the company's own request/relationship state so we can label each
  // accountant (pending / connected) and prevent duplicate requests.
  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/company/accountant-requests");
      if (res.ok) {
        const d = await res.json();
        setRequests(d.requests ?? []);
      }
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    if (open) loadRequests();
  }, [open, loadRequests]);

  const runSearch = useCallback(async (term: string) => {
    setSearchState("loading");
    try {
      const res = await fetch(`/api/accountants/directory?q=${encodeURIComponent(term)}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      setResults(d.accountants ?? []);
      setSearchState("idle");
    } catch {
      setSearchState("error");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(q), 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q, open, runSearch]);

  function statusFor(accountantId: string): "pending" | "active" | null {
    const r = requests.find((x) => x.accountantId === accountantId);
    if (r?.status === "pending") return "pending";
    if (r?.status === "active") return "active";
    return null;
  }

  async function request(accountantId: string) {
    setBusy(accountantId);
    try {
      const res = await fetch("/api/accountant/connection-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountantId }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(d.alreadyPending ? "Förfrågan väntar redan" : "Förfrågan skickad");
        loadRequests();
      } else if (res.status === 409 && d.alreadyConnected) {
        toast.info("Redan kopplad till denna revisor");
        loadRequests();
      } else if (res.status === 403) {
        toast.error("Endast ägare/admin kan begära revisor");
      } else {
        toast.error(d.error ?? "Kunde inte skicka förfrågan");
      }
    } catch {
      toast.error("Kunde inte skicka förfrågan");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hitta en revisor</CardTitle>
        <CardDescription>
          Sök bland redovisningskonsulter och skicka en förfrågan. Revisorn får åtkomst
          först när hen accepterar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!open ? (
          <Button onClick={() => setOpen(true)}>Lägg till redovisningskonsult</Button>
        ) : (
          <div className="space-y-4">
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Sök på namn eller e-post…"
            />

            {searchState === "loading" ? (
              <p className="text-sm text-gray-500">Söker…</p>
            ) : searchState === "error" ? (
              <p className="text-sm text-red-600">Kunde inte söka. Försök igen.</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-gray-500">
                {q ? "Inga revisorer matchar sökningen." : "Inga revisorer att visa."}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-white/[0.07]">
                {results.map((a) => {
                  const st = statusFor(a.id);
                  return (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div>
                        <p className="font-medium">{a.name ?? a.email}</p>
                        <p className="text-xs text-gray-500">{a.email}</p>
                      </div>
                      {st === "active" ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300">
                          Kopplad
                        </Badge>
                      ) : st === "pending" ? (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                          Väntar
                        </Badge>
                      ) : (
                        <Button disabled={busy === a.id} onClick={() => request(a.id)}>
                          {busy === a.id ? "Skickar…" : "Skicka förfrågan"}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500 hover:underline"
            >
              Stäng
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
