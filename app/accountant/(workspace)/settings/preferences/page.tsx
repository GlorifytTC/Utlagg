"use client";

import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { SectionHeader } from "@/components/settings/SettingsShell";
import { PreferencesCard } from "@/components/settings/PreferencesCard";

export default function AccountantPreferencesPage() {
  const { lang } = useLanguage();
  return (
    <div className="space-y-6">
      <SectionHeader title={accountantStrings(lang).settingsPreferences} />
      <PreferencesCard />
    </div>
  );
}
