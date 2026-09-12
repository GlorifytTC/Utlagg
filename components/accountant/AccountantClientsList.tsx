"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ClientRow {
  companyId: string;
  companyName: string;
  city: string | null;
  country: string | null;
  connectedAt: string | null;
  receiptCount: number;
}

/**
 * Active-clients list for the accountant. Binds to GET /api/accountant/clients
 * ({ clients, total, page, pageSize }). Renders the app's card/table language
 * with explicit loading / empty / error states.
 */
export function AccountantClientsList() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  const load = useCallback(async (p: number) => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/accountant/clients?page=${p}&pageSize=25`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.clients ?? []);
      setTotal(data.total ?? 0);
      setPageSize(data.pageSize ?? 25);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  if (status === "loading") {
    return <p className="text-sm text-ink/50">Laddar klienter…</p>;
  }
  if (status === "error") {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-red-600">Kunde inte ladda klienter. Försök igen.</p>
          <Button variant="outline" className="mt-3" onClick={() => load(page)}>
            Försök igen
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="font-medium text-ink">Inga klienter ännu</p>
          <p className="mt-1 text-sm text-ink/60">
            När ett företag kopplar dig som revisor dyker det upp här. Du kan också se
            inkommande förfrågningar under Förfrågningar.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-ink/50 dark:border-white/[0.08]">
                <th className="px-5 py-3 font-medium">Företag</th>
                <th className="px-5 py-3 font-medium">Ort</th>
                <th className="px-5 py-3 font-medium">Kvitton</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.companyId}
                  className="border-b border-gray-100 last:border-0 dark:border-white/[0.05]"
                >
                  <td className="px-5 py-3 font-medium text-ink">{c.companyName}</td>
                  <td className="px-5 py-3 text-ink/70">{c.city || "—"}</td>
                  <td className="px-5 py-3 text-ink/70">{c.receiptCount}</td>
                  <td className="px-5 py-3">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300">
                      Aktiv
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/accountant/clients/${c.companyId}`}
                      className="text-nordic-600 hover:underline"
                    >
                      Öppna
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink/50">
            Sida {page} av {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Föregående
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Nästa
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
