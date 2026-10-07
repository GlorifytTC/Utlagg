"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/ui/error-state";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { LogoUploader } from "@/components/dashboard/LogoUploader";
import { SectionHeader } from "@/components/settings/SettingsShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Firm = { name: string; logoUrl: string | null };

/** Firm name + logo. Anyone in the firm sees it; only owner/admin edits (also enforced by PATCH /api/accountant/firm). */
export function FirmSettings() {
  const { lang } = useLanguage();
  const at = accountantStrings(lang);
  const [firm, setFirm] = useState<Firm | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/firm/members")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.firm) return setFailed(true);
        setFirm(d.firm);
        setName(d.firm.name);
        setCanEdit(d.myRole === "owner" || d.myRole === "admin");
      })
      .catch(() => setFailed(true));
  }, []);

  async function patch(body: { name?: string; logoUrl?: string | null }) {
    const res = await fetch("/api/accountant/firm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? at.error);
      throw new Error();
    }
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await patch({ name: name.trim() });
      setFirm((f) => f && { ...f, name: name.trim() });
      toast.success(at.settingsSaved);
    } catch {
      /* patch already toasted */
    } finally {
      setSaving(false);
    }
  }

  if (failed) return <ErrorState>{at.error}</ErrorState>;
  if (!firm) return <div className="skeleton h-48 rounded-2xl" aria-busy="true" aria-label={at.loading} />;

  return (
    <div className="space-y-6">
      <SectionHeader title={at.settingsFirm} subtitle={at.settingsFirmDesc} />
      {!canEdit && <p className="text-sm text-gray-500 dark:text-gray-400">{at.settingsFirmReadOnly}</p>}
      <Card>
        <form onSubmit={saveName}>
          <CardHeader>
            <CardTitle>{at.settingsFirmName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firm-name">{at.settingsFirmName}</Label>
              <Input id="firm-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} required readOnly={!canEdit} />
            </div>
            {canEdit && (
              <Button type="submit" disabled={saving || !name.trim() || name.trim() === firm.name}>
                {saving ? at.settingsSaving : at.settingsSave}
              </Button>
            )}
          </CardContent>
        </form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{at.menuFirmLogo}</CardTitle>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <LogoUploader value={firm.logoUrl} label={at.menuFirmLogo} onSave={(logoUrl) => patch({ logoUrl })} />
          ) : firm.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={firm.logoUrl} alt={firm.name} className="h-16 w-16 rounded-xl object-contain" />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
