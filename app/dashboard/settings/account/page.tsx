"use client";

import { useLanguage } from "@/context/LanguageContext";
import { SectionHeader } from "@/components/settings/SettingsShell";
import { NameForm } from "@/components/settings/NameForm";
import { PasswordCard } from "@/components/settings/PasswordCard";
import { DeleteAccountCard } from "@/components/settings/DeleteAccountCard";

export default function AccountSettingsPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <SectionHeader title={t.setAccount} />
      <NameForm />
      <PasswordCard />
      <DeleteAccountCard />
    </div>
  );
}
