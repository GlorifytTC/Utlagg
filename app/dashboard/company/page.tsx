"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Company { id: string; name: string; orgNumber?: string; vatNumber?: string; }
interface Member { id: string; userId: string; role: string; email: string | null; name: string | null; }

export default function CompanyPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", orgNumber: "", vatNumber: "" });
  const [invite, setInvite] = useState({ email: "", role: "member" });

  const load = useCallback(async () => {
    const r = await fetch("/api/company");
    const d = await r.json();
    setCompany(d.company);
    setRole(d.role);
    if (d.company) {
      const m = await fetch("/api/company/members");
      if (m.ok) setMembers((await m.json()).members);
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const canManage = role === "owner" || role === "admin";

  async function createCompany() {
    if (!form.name) { toast.error("Ange företagsnamn"); return; }
    const r = await fetch("/api/company", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (r.ok) { toast.success("Företag skapat"); load(); }
    else { const e = await r.json().catch(() => ({})); toast.error(e.error ?? "Kunde inte skapa"); }
  }

  async function sendInvite() {
    if (!invite.email) { toast.error("Ange e-post"); return; }
    const r = await fetch("/api/company/invite", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invite),
    });
    if (r.ok) { toast.success("Inbjudan skickad"); setInvite({ email: "", role: "member" }); }
    else { const e = await r.json().catch(() => ({})); toast.error(e.error ?? "Kunde inte bjuda in"); }
  }

  async function changeRole(memberId: string, newRole: string) {
    const r = await fetch("/api/company/members", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, role: newRole }),
    });
    if (r.ok) { toast.success("Roll uppdaterad"); load(); } else toast.error("Kunde inte uppdatera");
  }

  async function removeMember(memberId: string) {
    if (!confirm("Ta bort medlemmen?")) return;
    const r = await fetch(`/api/company/members?memberId=${memberId}`, { method: "DELETE" });
    if (r.ok) { toast.success("Borttagen"); load(); }
    else { const e = await r.json().catch(() => ({})); toast.error(e.error ?? "Kunde inte ta bort"); }
  }

  if (loading) return <p className="text-sm text-gray-500">Laddar…</p>;

  if (!company) {
    return (
      <div className="max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Företag</h1>
        <Card>
          <CardHeader>
            <CardTitle>Skapa företag</CardTitle>
            <CardDescription>Skapa ett företag för att bjuda in kollegor och dela utlägg.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Företagsnamn</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Organisationsnummer</Label>
              <Input value={form.orgNumber} onChange={(e) => setForm({ ...form, orgNumber: e.target.value })} placeholder="556677-8899" /></div>
            <div className="space-y-2"><Label>Momsregistreringsnummer</Label>
              <Input value={form.vatNumber} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })} placeholder="SE556677889901" /></div>
            <Button onClick={createCompany}>Skapa företag</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{company.name}</h1>

      <Card>
        <CardHeader><CardTitle>Medlemmar</CardTitle><CardDescription>Din roll: {role}</CardDescription></CardHeader>
        <CardContent>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{m.name ?? m.email}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {canManage && m.role !== "owner" ? (
                    <select value={m.role} onChange={(e) => changeRole(m.id, e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-950">
                      <option value="member">Medlem</option>
                      <option value="approver">Attestant</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (<span className="text-sm text-gray-500">{m.role}</span>)}
                  {canManage && m.role !== "owner" && (
                    <button onClick={() => removeMember(m.id)} className="text-sm text-red-600 hover:underline">Ta bort</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {canManage && (
        <Card>
          <CardHeader><CardTitle>Bjud in kollega</CardTitle><CardDescription>Skickar en inbjudan via e-post (gäller 7 dagar).</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap items-end gap-2">
            <div className="space-y-2"><Label>E-post</Label>
              <Input type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="kollega@foretag.se" /></div>
            <div className="space-y-2"><Label>Roll</Label>
              <select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}
                className="flex h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-950">
                <option value="member">Medlem</option>
                <option value="approver">Attestant</option>
                <option value="admin">Admin</option>
              </select></div>
            <Button onClick={sendInvite}>Skicka inbjudan</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
