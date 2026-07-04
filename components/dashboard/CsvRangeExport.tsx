"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function CsvRangeExport() {
  const now = new Date();
  const [from, setFrom] = useState(iso(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(iso(now));
  const [isDownloading, setIsDownloading] = useState(false);

  function presetThisMonth() {
    setFrom(iso(new Date(now.getFullYear(), now.getMonth(), 1)));
    setTo(iso(now));
  }
  function presetThisYear() {
    setFrom(iso(new Date(now.getFullYear(), 0, 1)));
    setTo(iso(now));
  }
  function presetLast12() {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - 1);
    setFrom(iso(d));
    setTo(iso(now));
  }

  function download() {
    setIsDownloading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.location.href = `/api/export/csv?${params.toString()}`;
    setTimeout(() => setIsDownloading(false), 1000);
  }

  return (
    <Card className="rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm transition-shadow hover:shadow-sm dark:border-white/[0.07] dark:bg-[#0D0D0D]">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg text-gray-900 dark:text-white">Exportera kvitton (CSV)</CardTitle>
        <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
          Välj en period — t.ex. en månad eller ett helt år.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" onClick={presetThisMonth} className="rounded-full border border-gray-900/[0.15] px-4 py-2 text-sm hover:border-gray-900/40 dark:border-white/[0.15] dark:hover:border-white/40">
              Denna månad
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" onClick={presetThisYear} className="rounded-full border border-gray-900/[0.15] px-4 py-2 text-sm hover:border-gray-900/40 dark:border-white/[0.15] dark:hover:border-white/40">
              I år
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" onClick={presetLast12} className="rounded-full border border-gray-900/[0.15] px-4 py-2 text-sm hover:border-gray-900/40 dark:border-white/[0.15] dark:hover:border-white/40">
              Senaste 12 mån
            </Button>
          </motion.div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 dark:text-gray-400">Från</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111]" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 dark:text-gray-400">Till</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111]" />
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={download} 
              disabled={isDownloading}
              className={cn(
                "rounded-full bg-gray-900 px-5 py-2 text-sm text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100",
                isDownloading && "opacity-70 cursor-not-allowed",
              )}
            >
              {isDownloading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-gray-900 dark:border-t-transparent" />
                  Laddar...
                </span>
              ) : (
                "Ladda ner CSV"
              )}
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}