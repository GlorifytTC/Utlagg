"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

type Notif = { type: "connection_request" | "accepted" | "message"; actorName: string; href: string };

const POLL_MS = 25_000;

/**
 * Global poller: every ~25s it asks /api/notifications for social events newer
 * than the last poll and toasts them, so connection requests / acceptances /
 * chat messages appear live without a reload. Renders nothing; mounted once in
 * Providers. `since` is held per-user in localStorage so a reload does not
 * re-toast history. Pauses while the tab is hidden.
 */
export function NotificationPoller() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const router = useRouter();
  const userId = session?.user?.id;

  // Latest values, read inside the interval without re-arming it.
  const tRef = useRef(t);
  tRef.current = t;
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    if (!userId) return;
    const key = `notif:since:${userId}`;
    let since = localStorage.getItem(key) ?? new Date().toISOString();

    async function poll() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/notifications?since=${encodeURIComponent(since)}`);
        if (!res.ok) return;
        const data: { events: Notif[]; now: string } = await res.json();
        const tr = tRef.current;
        const label: Record<Notif["type"], string> = {
          connection_request: tr.notifConnectionRequest,
          accepted: tr.notifAccepted,
          message: tr.notifMessage,
        };
        for (const e of data.events) {
          toast.success(label[e.type].replace("{name}", e.actorName), {
            action: { label: "→", onClick: () => routerRef.current.push(e.href) },
          });
        }
        since = data.now;
        localStorage.setItem(key, since);
      } catch {
        // A failed poll is a no-op — never surface it as a toast.
      }
    }

    const iv = setInterval(poll, POLL_MS);
    // Catch up immediately when the tab regains focus.
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);

  return null;
}
