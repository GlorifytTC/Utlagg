"use client";

import { useLanguage } from "@/context/LanguageContext";
import { EmailIntakeCard } from "@/components/dashboard/EmailIntakeCard";
import { SectionHeader } from "@/components/settings/SettingsShell";
import { PreferencesCard } from "@/components/settings/PreferencesCard";

export default function PreferencesPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <SectionHeader title={t.setPreferences} />
      <PreferencesCard />
      <EmailIntakeCard />
    </div>
  );
}
