"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoUploader } from "@/components/dashboard/LogoUploader";
import { useLanguage } from "@/context/LanguageContext";

interface Profile {
  accountantDiscoverable: boolean;
  industry: string | null;
  discoveryDescription: string | null;
  logoUrl: string | null;
}
interface Incoming {
  id: string;
  accountantId: string;
  name: string | null;
  email: string;
  createdAt: string;
}

/**
 * Company settings: "Looking for an accountant" discovery profile (owner/admin),
 * plus incoming accountant connection requests to accept/decline. Binds to
 * GET/PATCH /api/company/discovery and GET /api/company/accountant-requests +
 * its [id]/accept|decline routes. Native card/input/toast styling.
 */
export function CompanyDiscoverySettings() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [incoming, setIncoming] = useState<Incoming[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [p, r] = await Promise.all([
        fetch("/api/company/discovery").then((x) => (x.ok ? x.json() : null)),
        fetch("/api/company/accountant-requests").then((x) => (x.ok ? x.json() : null)),
      ]);
      if (p?.profile) setProfile(p.profile);
      else setProfile({ accountantDiscoverable: false, industry: "", discoveryDescription: "", logoUrl: null });
      setRole(p?.role ?? null);
      setIncoming(r?.incoming ?? []);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(next: Partial<Profile>) {
    setSaving(true);
    try {
      const res = await fetch("/api/company/discovery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (res.ok) {
        setProfile((prev) => (prev ? { ...prev, ...next } : prev));
        toast.success(t.discSaved);
      } else {
        toast.error(t.toastSaveFail);
      }
    } finally {
      setSaving(false);
    }
  }

  async function respond(id: string, action: "accept" | "decline") {
    setBusy(id);
    try {
      const res = await fetch(`/api/company/accountant-requests/${id}/${action}`, { method: "POST" });
      if (res.ok) {
        toast.success(action === "accept" ? t.discAccountantConnected : t.discRequestDeclined);
        setIncoming((prev) => prev.filter((x) => x.id !== id));
      } else {
        toast.error(t.error);
      }
    } finally {
      setBusy(null);
    }
  }

  if (status === "loading") return null;
  if (status === "error" || !profile) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.discTitle}</CardTitle>
        <CardDescription>
          {t.discDesc}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {role === "owner" && (
          <LogoUploader
            value={profile.logoUrl}
            label={t.discCompanyLogo}
            onSave={async (dataUrl) => {
              await save({ logoUrl: dataUrl } as Partial<Profile>);
            }}
          />
        )}

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={profile.accountantDiscoverable}
            onChange={(e) => save({ accountantDiscoverable: e.target.checked })}
            disabled={saving}
            className="h-4 w-4"
          />
          <span className="text-sm">{t.discVisible}</span>
        </label>

        {profile.accountantDiscoverable && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">{t.discIndustry}</label>
              <Input
                defaultValue={profile.industry ?? ""}
                onBlur={(e) => save({ industry: e.target.value || null })}
                placeholder={t.discIndustryPlaceholder}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">{t.discDescription}</label>
              <Input
                defaultValue={profile.discoveryDescription ?? ""}
                onBlur={(e) => save({ discoveryDescription: e.target.value || null })}
                placeholder={t.discDescriptionPlaceholder}
              />
            </div>
          </div>
        )}

        {incoming.length > 0 && (
          <div className="border-t border-gray-100 pt-4 dark:border-white/[0.07]">
            <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">{t.discIncoming}</p>
            <ul className="divide-y divide-gray-100 dark:divide-white/[0.07]">
              {incoming.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{r.name ?? r.email}</p>
                    <p className="text-xs text-gray-500">{r.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button disabled={busy === r.id} onClick={() => respond(r.id, "accept")}>
                      {t.accept}
                    </Button>
                    <Button variant="outline" disabled={busy === r.id} onClick={() => respond(r.id, "decline")}>
                      {t.decline}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
