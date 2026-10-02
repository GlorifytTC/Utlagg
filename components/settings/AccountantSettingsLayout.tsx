"use client";

import { Building2, Eye, SlidersHorizontal, User, Users } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { SettingsShell } from "@/components/settings/SettingsShell";

export function AccountantSettingsLayout({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  const at = accountantStrings(lang);
  const base = "/accountant/settings";
  return (
    <SettingsShell
      title={at.settingsTitle}
      subtitle={at.settingsSubtitle}
      groups={[
        {
          label: at.settingsGroupPersonal,
          items: [
            { href: `${base}/account`, label: at.settingsAccount, icon: User },
            { href: `${base}/preferences`, label: at.settingsPreferences, icon: SlidersHorizontal },
          ],
        },
        {
          label: at.settingsGroupFirm,
          items: [
            { href: `${base}/firm`, label: at.settingsFirm, icon: Building2 },
            { href: `${base}/team`, label: at.navTeam, icon: Users },
            { href: `${base}/visibility`, label: at.settingsVisibility, icon: Eye },
          ],
        },
      ]}
    >
      {children}
    </SettingsShell>
  );
}
