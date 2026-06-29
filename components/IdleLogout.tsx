"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";

// Minutes of inactivity before logout. Configurable, defaults to 30.
const IDLE_MIN = Number(process.env.NEXT_PUBLIC_IDLE_MINUTES) || 30;
const WARN_SECONDS = 60; // show the warning this long before logging out

export function IdleLogout() {
  const { status } = useSession();
  const { t, lang } = useLanguage();
  const [warning, setWarning] = useState(false);
  const [secs, setSecs] = useState(WARN_SECONDS);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdown = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = () => {
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (countdown.current) clearInterval(countdown.current);
  };

  const doLogout = useCallback(() => {
    clearAll();
    signOut({ callbackUrl: "/login" });
  }, []);

  const reset = useCallback(() => {
    clearAll();
    setWarning(false);
    if (status !== "authenticated") return;
    const idleMs = IDLE_MIN * 60 * 1000;
    warnTimer.current = setTimeout(() => {
      setSecs(WARN_SECONDS);
      setWarning(true);
      countdown.current = setInterval(() => {
        setSecs((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
    }, idleMs - WARN_SECONDS * 1000);
    logoutTimer.current = setTimeout(doLogout, idleMs);
  }, [status, doLogout]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    // While the warning is up, activity should NOT auto-dismiss it — the user
    // must click "stay" — so we only listen for activity when not warning.
    const onActivity = () => {
      if (!warning) reset();
    };
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, warning, reset]);

  if (status !== "authenticated" || !warning) return null;

  const body =
    lang === "sv"
      ? `Du loggas ut om ${secs} sekunder på grund av inaktivitet.`
      : `You'll be logged out in ${secs} seconds due to inactivity.`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-[#111]">
        <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
          {t.idleTitle}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{body}</p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={reset}
            className="flex-1 rounded-lg bg-nordic-600 px-4 py-2 text-sm font-medium text-white hover:bg-nordic-700"
          >
            {t.idleStay}
          </button>
          <button
            onClick={doLogout}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/[0.10] dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t.idleLogout}
          </button>
        </div>
      </div>
    </div>
  );
}
