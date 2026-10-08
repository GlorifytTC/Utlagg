"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Platform-admin form: add an admin or worker to a company. */
export function AdminAddMember({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "member" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error("Fyll i förnamn, efternamn och e-post.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/companies/${companyId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(d.error ?? "Kunde inte lägga till.");
        return;
      }
      toast.success(
        d.status === "invited"
          ? "Inbjudan skickad. Personen väljer lösenord via e-post och läggs till direkt."
          : "Tillagd i företaget.",
      );
      setForm({ firstName: "", lastName: "", email: "", role: "member" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="am-first">Förnamn</Label>
        <Input id="am-first" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="am-last">Efternamn</Label>
        <Input id="am-last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="am-email">E-post</Label>
        <Input
          id="am-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="namn@foretag.se"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="am-role">Roll</Label>
        <Select id="am-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="member">Medarbetare</option>
          <option value="admin">Admin</option>
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>{busy ? "Lägger till…" : "Lägg till i företaget"}</Button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 sm:col-span-2">
        Finns kontot redan läggs det till direkt. Är e-posten ny skapas ett konto och personen får ett mejl för att välja lösenord.
      </p>
    </form>
  );
}
