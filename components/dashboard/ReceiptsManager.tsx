"use client";

import { useState } from "react";
import { ReceiptUploader } from "@/components/dashboard/ReceiptUploader";
import { ReceiptTable } from "@/components/dashboard/ReceiptTable";
import { UsageMeter } from "@/components/dashboard/UsageMeter";

export function ReceiptsManager({
  used,
  limit,
  tier,
}: {
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
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <ReceiptUploader onSaved={handleSaved} />
        <UsageMeter used={scansUsed} limit={limit} tier={tier} />
      </div>
      <ReceiptTable refreshKey={refreshKey} />
    </div>
  );
}
