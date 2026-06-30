"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
// The uploader is heavily browser-dependent (Tesseract Web Worker, camera,
// File API) and seeds its initial form state from `new Date()`. Server-
// rendering it and then hydrating produced React hydration mismatches
// (#418/#423) once Tesseract started running. It has zero SSR benefit, so
// render it client-only — this removes the entire mismatch class cleanly.
const ReceiptUploader = dynamic(
  () => import("@/components/dashboard/ReceiptUploader").then((m) => m.ReceiptUploader),
  { ssr: false },
);
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="space-y-6"
    >
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <ReceiptUploader onSaved={handleSaved} />
        <UsageMeter used={scansUsed} limit={limit} tier={tier} />
      </div>
      <ReceiptTable refreshKey={refreshKey} />
    </motion.div>
  );
}