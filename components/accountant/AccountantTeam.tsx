"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { SectionHeader } from "@/components/settings/SettingsShell";

interface Member {
  userId: string;
  name: string | null;
  email: string;
  role: "owner" | "admin" | "member";
}
interface PendingInvite {
  id: string;
  email: string;
  role: string;
}
interface Client {
  companyId: string;
  companyName: string;
}

const CARD = "rounded-2xl panel p-5";
const SECTION_LABEL = "mb-2 text-sm font-medium text-gray-500 dark:text-gray-400";

function RoleBadge({ role, t }: { role: string; t: ReturnType<typeof accountantStrings> }) {
  const label = role === "owner" ? t.teamRoleOwner : role === "admin" ? t.teamRoleAdmin : t.teamRoleMember;
  const tone = role === "owner" ? "accent" : role === "admin" ? "warning" : "neutral";
  return <Badge tone={tone}>{label}</Badge>;
}

export function AccountantTeam() {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);

  const [myRole, setMyRole] = useState<string>("member");
  const [members, setMembers] = useState<Member[]>([]);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirst, setInviteFirst] = useState("");
  const [inviteLast, setInviteLast] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/firm/members");
      if (!res.ok) throw new Error();
      const d = await res.json();
      setMyRole(d.myRole ?? "member");
      setMembers(d.members ?? []);
      setPending(d.pendingInvites ?? []);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canManage = myRole === "owner" || myRole === "admin";

  async function invite() {
    if (!inviteEmail.trim() || !inviteFirst.trim() || !inviteLast.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/firm/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          firstName: inviteFirst.trim(),
          lastName: inviteLast.trim(),
          role: inviteRole,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(d.alreadyPending ? t.teamPending : t.teamSend);
        setInviteEmail("");
        setInviteFirst("");
        setInviteLast("");
        load();
      } else {
        toast.error(d.error ?? t.error);
      }
    } finally {
      setInviting(false);
    }
  }

  async function remove(userId: string) {
    try {
      const res = await fetch(`/api/firm/members/${userId}`, { method: "POST" });
      if (res.ok) {
        toast.success(t.teamRemove);
        setMembers((m) => m.filter((x) => x.userId !== userId));
        setConfirmRemove(null);
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error ?? t.error);
      }
    } catch {
      toast.error(t.error);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <SectionHeader title={t.teamTitle} subtitle={t.teamSubtitle} />

      {status === "loading" ? (
        <div className="skeleton h-48 rounded-2xl" aria-busy="true" aria-label={t.loading} />
      ) : status === "error" ? (
        <ErrorState onRetry={load} retryLabel={t.retry}>{t.error}</ErrorState>
      ) : (
        <>
          {/* Members */}
          <div className={CARD}>
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">{t.teamMembers}</h2>
            {members.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.teamNoMembers}</p>
            ) : (
              <ul className="divide-y divide-gray-900/[0.06] dark:divide-white/[0.06]">
                {members.map((m) => (
                  <li key={m.userId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div className="min-w-0 basis-full sm:basis-auto">
                      <p className="font-medium text-gray-900 dark:text-white">{m.name ?? m.email}</p>
                      <p className="break-all text-xs text-gray-500 dark:text-gray-400">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoleBadge role={m.role} t={t} />
                      {canManage && m.role !== "owner" && (
                        confirmRemove === m.userId ? (
                          <span className="flex flex-wrap items-center gap-1">
                            <span className="mr-1 text-xs text-gray-500 dark:text-gray-400">{t.teamRemoveConfirm}</span>
                            <Button variant="destructive" onClick={() => remove(m.userId)} className="!h-11 !px-3 !text-xs lg:!h-8">
                              {t.teamRemove}
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setConfirmRemove(null)}
                              aria-label={t.teamRemoveCancel}
                              title={t.teamRemoveCancel}
                              className="!h-11 !w-11 !p-0 text-gray-500 dark:text-gray-400 lg:!h-8 lg:!w-8"
                            >
                              <X className="h-4 w-4" strokeWidth={1.75} />
                            </Button>
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            onClick={() => setConfirmRemove(m.userId)}
                            className="!h-11 !px-3 !text-xs text-red-600 hover:bg-red-50/70 dark:text-red-400 dark:hover:bg-red-950/25 lg:!h-8"
                          >
                            {t.teamRemove}
                          </Button>
                        )
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Invite (owner/admin only) */}
          {canManage && (
            <div className={CARD}>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <UserPlus className="h-4 w-4" strokeWidth={1.75} /> {t.teamInvite}
              </h2>
              <div className="grid items-end gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="inv-first" className="mb-1.5 block">{t.teamFirstName}</Label>
                  <Input id="inv-first" value={inviteFirst} onChange={(e) => setInviteFirst(e.target.value)} placeholder={t.teamFirstName} />
                </div>
                <div>
                  <Label htmlFor="inv-last" className="mb-1.5 block">{t.teamLastName}</Label>
                  <Input id="inv-last" value={inviteLast} onChange={(e) => setInviteLast(e.target.value)} placeholder={t.teamLastName} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="inv-email" className="mb-1.5 block">{t.teamInviteEmail}</Label>
                  <Input id="inv-email" type="email" autoComplete="off" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="namn@byra.se" />
                </div>
                <div>
                  <Label htmlFor="inv-role" className="mb-1.5 block">{t.teamInviteRole}</Label>
                  <Select id="inv-role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}>
                    <option value="member">{t.teamRoleMember}</option>
                    <option value="admin">{t.teamRoleAdmin}</option>
                  </Select>
                </div>
                <Button onClick={invite} disabled={inviting || !inviteEmail.trim() || !inviteFirst.trim() || !inviteLast.trim()} className="w-full sm:w-auto sm:justify-self-start">
                  {inviting ? t.loading : t.teamSend}
                </Button>
              </div>

              {pending.length > 0 && (
                <div className="mt-5 border-t border-gray-900/[0.06] pt-4 dark:border-white/[0.06]">
                  <p className={SECTION_LABEL}>{t.teamPending}</p>
                  <ul className="space-y-2">
                    {pending.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 break-all text-gray-600 dark:text-gray-300">{p.email}</span>
                        <span className="shrink-0"><RoleBadge role={p.role} t={t} /></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Assignments (owner/admin only) */}
          {canManage && <AssignmentsPanel t={t} />}
        </>
      )}
    </div>
  );
}

/**
 * Per-customer worker assignments. Owner/admin pick a customer, then assign or
 * unassign co-workers to it. Uses GET/POST/DELETE
 * /api/firm/customers/[companyId]/assignments and the accountant clients list.
 */
function AssignmentsPanel({ t }: { t: ReturnType<typeof accountantStrings> }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [assigned, setAssigned] = useState<{ workerId: string; name: string | null; email: string }[]>([]);
  const [workers, setWorkers] = useState<{ userId: string; name: string | null; email: string; role: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/accountant/clients?pageSize=100")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list: Client[] = (d?.clients ?? []).map((c: { companyId: string; companyName: string }) => ({
          companyId: c.companyId,
          companyName: c.companyName,
        }));
        setClients(list);
        if (list.length && !selected) setSelected(list[0].companyId);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAssignments = useCallback(async (companyId: string) => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/firm/customers/${companyId}/assignments`);
      if (res.ok) {
        const d = await res.json();
        setAssigned(d.assigned ?? []);
        setWorkers(d.firmWorkers ?? []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (selected) loadAssignments(selected);
  }, [selected, loadAssignments]);

  async function assign(workerId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/firm/customers/${selected}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId }),
      });
      if (res.ok) loadAssignments(selected);
      else toast.error(t.error);
    } finally {
      setBusy(false);
    }
  }
  async function unassign(workerId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/firm/customers/${selected}/assignments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId }),
      });
      if (res.ok) loadAssignments(selected);
      else toast.error(t.error);
    } finally {
      setBusy(false);
    }
  }

  const assignedIds = new Set(assigned.map((a) => a.workerId));
  // Only actual workers (members) need assigning; owner/admin see all anyway.
  const assignableWorkers = workers.filter((w) => w.role === "member" && !assignedIds.has(w.userId));

  return (
    <div className={CARD}>
      <h2 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">{t.teamAssignTitle}</h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{t.teamAssignHint}</p>

      {clients.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.clientsEmpty}</p>
      ) : (
        <>
          <Select value={selected} onChange={(e) => setSelected(e.target.value)} aria-label={t.teamAssignTitle} className="mb-4">
            {clients.map((c) => (
              <option key={c.companyId} value={c.companyId}>
                {c.companyName}
              </option>
            ))}
          </Select>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className={SECTION_LABEL}>{t.teamAssignedTo}</p>
              {assigned.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.teamNoAssignments}</p>
              ) : (
                <ul className="space-y-1.5">
                  {assigned.map((a) => (
                    <li key={a.workerId} className="flex items-center justify-between rounded-xl bg-gray-900/[0.03] py-1.5 pl-3 pr-1.5 text-sm dark:bg-white/[0.04]">
                      <span className="min-w-0 break-all text-gray-700 dark:text-gray-200">{a.name ?? a.email}</span>
                      <Button
                        variant="ghost"
                        onClick={() => unassign(a.workerId)}
                        disabled={busy}
                        aria-label={t.teamUnassign}
                        title={t.teamUnassign}
                        className="!h-11 !w-11 !p-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 lg:!h-8 lg:!w-8"
                      >
                        <X className="h-4 w-4" strokeWidth={1.75} />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className={SECTION_LABEL}>{t.teamMembers}</p>
              {assignableWorkers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.teamNoMembers}</p>
              ) : (
                <ul className="space-y-1.5">
                  {assignableWorkers.map((w) => (
                    <li key={w.userId} className="flex items-center justify-between rounded-xl py-1.5 pl-3 pr-1.5 text-sm">
                      <span className="text-gray-700 dark:text-gray-200">{w.name ?? w.email}</span>
                      <Button variant="outline" onClick={() => assign(w.userId)} disabled={busy} className="!h-11 !px-3 !text-xs lg:!h-8">
                        {t.teamAssign}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
