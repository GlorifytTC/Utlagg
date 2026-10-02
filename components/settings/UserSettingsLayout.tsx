"use client";

import { Building2, CreditCard, Plug, SlidersHorizontal, Store, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { SettingsShell } from "@/components/settings/SettingsShell";

/** `showBilling` is false for company admins/members: billing is the owner's job. */
export function UserSettingsLayout({ showBilling, children }: { showBilling: boolean; children: React.ReactNode }) {
  const { t } = useLanguage();
  const base = "/dashboard/settings";
  return (
    <SettingsShell
      title={t.navSettings}
      subtitle={t.setSubtitle}
      groups={[
        {
          label: t.setGroupPersonal,
          items: [
            { href: `${base}/account`, label: t.setAccount, icon: User },
            { href: `${base}/preferences`, label: t.setPreferences, icon: SlidersHorizontal },
          ],
        },
        {
          label: t.setGroupCompany,
          items: [
            { href: `${base}/company`, label: t.navCompany, icon: Building2 },
            { href: `${base}/accountants`, label: t.setAccountants, icon: Store },
            ...(showBilling ? [{ href: `${base}/billing`, label: t.navSubscription, icon: CreditCard }] : []),
            { href: `${base}/integrations`, label: t.navIntegrations, icon: Plug },
          ],
        },
      ]}
    >
      {children}
    </SettingsShell>
  );
}
