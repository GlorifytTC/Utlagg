"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogoUploader } from "@/components/dashboard/LogoUploader";
import { SectionHeader } from "@/components/settings/SettingsShell";
import { useLanguage } from "@/context/LanguageContext";

/** Company identity row: logo beside the company name. Only the owner can change the logo (enforced by PATCH /api/company/discovery). */
export function CompanyLogoCard({ name, isOwner }: { name: string; isOwner: boolean }) {
  const { t } = useLanguage();
  const [logo, setLogo] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/company/discovery")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLogo(d?.profile?.logoUrl ?? null))
      .catch(() => setLogo(null));
  }, []);

  async function save(logoUrl: string | null) {
    const res = await fetch("/api/company/discovery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoUrl }),
    });
    if (!res.ok) {
      toast.error(t.toastSaveFail);
      throw new Error();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {logo !== undefined &&
        (isOwner ? (
          <LogoUploader value={logo} label={t.discCompanyLogo} onSave={save} />
        ) : (
          logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={name} className="h-16 w-16 rounded-lg border border-gray-200 object-contain dark:border-white/10" />
          )
        ))}
      <SectionHeader title={name} />
    </div>
  );
}
