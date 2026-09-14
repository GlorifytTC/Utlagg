"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function AccountantOverview() {
  const [clients, setClients] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [opportunities, setOpportunities] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, r, d] = await Promise.all([
          fetch("/api/accountant/clients").then((x) => (x.ok ? x.json() : null)),
          fetch("/api/accountant/connection-requests").then((x) => (x.ok ? x.json() : null)),
          fetch("/api/accountant/discover/companies").then((x) => (x.ok ? x.json() : null)),
        ]);
        if (cancelled) return;
        setClients(c?.total ?? 0);
        setPending(
          (r?.requests ?? []).filter((x: { status: string }) => x.status === "pending").length,
        );
        setOpportunities(d?.companies?.length ?? 0);
      } catch {
        /* leave nulls → dashes */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    { label: "Aktiva klienter", value: clients },
    { label: "Väntande förfrågningar", value: pending },
    { label: "Företag söker revisor", value: opportunities },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-gray-900/[0.07] bg-gray-900/[0.07] dark:border-white/[0.07] dark:bg-white/[0.07]"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-[#F5F4F0] p-5 transition-colors hover:bg-gray-900/[0.03] dark:bg-[#0D0D0D] dark:hover:bg-white/[0.04]"
          >
            <p className="mb-3 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
              {s.label}
            </p>
            <p className="font-display text-[22px] font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
              {s.value ?? "—"}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
