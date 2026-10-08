"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/translations";
import { Card, CardContent } from "@/components/ui/card";

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex gap-1 rounded-full bg-gray-900/[0.05] p-1 dark:bg-white/[0.07]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => value !== o.value && onChange(o.value)}
          className={cn(
            "min-h-11 rounded-full px-4 text-sm font-medium transition duration-300 ease-premium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 md:min-h-10",
            value === o.value
              ? "bg-white text-gray-900 shadow-sm dark:bg-white/[0.14] dark:text-white"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Language + theme. Both are per-device preferences (cookie / localStorage), shared by user and accountant. */
export function PreferencesCard() {
  const { t, lang, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [soundOn, setSoundOn] = useState(true);
  useEffect(() => {
    fetch("/api/notifications/mute").then((r) => r.ok ? r.json() : null).then((d) => d && setSoundOn(!d.global)).catch(() => {});
  }, []);
  function setSound(on: boolean) {
    setSoundOn(on);
    fetch("/api/notifications/mute", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ muted: !on }) }).catch(() => setSoundOn(!on));
  }

  return (
    <Card>
      <CardContent className="space-y-5 pt-4 sm:pt-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">{t.prLanguageTitle}</p>
          <Segmented<Lang>
            label={t.prLanguageTitle}
            value={lang}
            options={[{ value: "sv", label: "Svenska" }, { value: "en", label: "English" }]}
            onChange={(l) => { setLanguage(l); router.refresh(); }}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">{t.setAppearance}</p>
          <Segmented<"light" | "dark">
            label={t.setAppearance}
            value={theme === "dark" ? "dark" : "light"}
            options={[{ value: "light", label: t.btnLightMode }, { value: "dark", label: t.btnDarkMode }]}
            onChange={toggleTheme}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">{t.prNotifSound}</p>
          <Segmented<"on" | "off">
            label={t.prNotifSound}
            value={soundOn ? "on" : "off"}
            options={[{ value: "on", label: t.prSoundOn }, { value: "off", label: t.prSoundOff }]}
            onChange={(v) => setSound(v === "on")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
