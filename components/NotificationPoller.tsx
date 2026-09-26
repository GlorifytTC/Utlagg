"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { useNotifications } from "@/context/NotificationContext";

type Notif = { type: "connection_request" | "accepted" | "message"; actorName: string; href: string };

const POLL_MS = 25_000;

function playNotifSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.start(); osc.stop(ctx.currentTime + 0.28);
  } catch {
    // AudioContext blocked (no user gesture yet) — silent fail is fine
  }
}

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
  const { increment } = useNotifications();
  const userId = session?.user?.id;

  // Latest values, read inside the interval without re-arming it.
  const tRef = useRef(t);
  tRef.current = t;
  const routerRef = useRef(router);
  routerRef.current = router;
  const incrementRef = useRef(increment);
  incrementRef.current = increment;

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
        const inc = incrementRef.current;
        const label: Record<Notif["type"], string> = {
          connection_request: tr.notifConnectionRequest,
          accepted: tr.notifAccepted,
          message: tr.notifMessage,
        };
        if (data.events.length > 0) playNotifSound();
        for (const e of data.events) {
          toast.success(label[e.type].replace("{name}", e.actorName), {
            action: { label: "→", onClick: () => routerRef.current.push(e.href) },
          });
          if (e.type === "message") inc("chat");
          else inc("requests");
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
