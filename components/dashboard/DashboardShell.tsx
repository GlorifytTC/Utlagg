"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { ReceiptUploader } from "@/components/dashboard/ReceiptUploader";
import { ReceiptTable } from "@/components/dashboard/ReceiptTable";
import { UsageMeter } from "@/components/dashboard/UsageMeter";

export function DashboardShell({
  name,
  used,
  limit,
  tier,
}: {
  name: string;
  used: number;
  limit: number;
  tier: string;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [scansUsed, setScansUsed] = useState(used);

  function handleSaved() {
    setRefreshKey((k) => k + 1);
    if (limit !== -1) setScansUsed((n) => n + 1);
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-xl font-semibold">
          Utlagg 
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-ink/60 sm:block">Hej, {name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-full border hairline px-4 py-2 hover:border-ink/40"
          >
            Logga ut
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <ReceiptUploader onSaved={handleSaved} />
          <UsageMeter used={scansUsed} limit={limit} tier={tier} />
        </div>
        <ReceiptTable refreshKey={refreshKey} />
      </div>
    </main>
  );
}
