"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoUploader } from "@/components/dashboard/LogoUploader";

/**
 * Accountant logo settings — the firm logo shown in the discovery directory.
 * Binds to GET/PATCH /api/accountant/logo (own logo only, server-authorized).
 */
export function AccountantLogoCard() {
  const [logo, setLogo] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/accountant/logo")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setLogo(d.logoUrl ?? null);
      })
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Din logotyp</CardTitle>
        <CardDescription>Visas för företag som hittar dig i katalogen.</CardDescription>
      </CardHeader>
      <CardContent>
        <LogoUploader
          value={logo}
          label="Byråns logotyp"
          onSave={async (dataUrl) => {
            const res = await fetch("/api/accountant/logo", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ logoUrl: dataUrl }),
            });
            if (res.ok) setLogo(dataUrl);
            else {
              const d = await res.json().catch(() => ({}));
              toast.error(d.error ?? "Kunde inte spara");
              throw new Error();
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
