"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

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

const CARD =
  "rounded-2xl border border-gray-900/[0.07] bg-white/60 p-5 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]";
const BTN =
  "inline-flex items-center gap-1.5 rounded-full bg-nordic-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-nordic-700 disabled:opacity-50";
const BTN_GHOST =
  "inline-flex items-center gap-1.5 rounded-full border border-gray-900/[0.12] px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-gray-900/30 dark:border-white/[0.12] dark:text-gray-300";
const INPUT =
  "w-full rounded-xl border border-gray-900/[0.12] bg-white/70 px-3 py-2 text-sm outline-none focus:border-nordic-600 dark:border-white/[0.12] dark:bg-white/[0.04]";

function RoleBadge({ role, t }: { role: string; t: ReturnType<typeof accountantStrings> }) {
  const label = role === "owner" ? t.teamRoleOwner : role === "admin" ? t.teamRoleAdmin : t.teamRoleMember;
  const cls =
    role === "owner"
      ? "bg-nordic-600/10 text-nordic-700 dark:bg-nordic-600/20 dark:text-nordic-300"
      : role === "admin"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
        : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.teamTitle}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t.teamSubtitle}</p>
      </div>

      {status === "loading" ? (
        <p className="text-sm text-gray-400">{t.loading}</p>
      ) : status === "error" ? (
        <p className="text-sm text-red-600">{t.error}</p>
      ) : (
        <>
          {/* Members */}
          <div className={CARD}>
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">{t.teamMembers}</h2>
            {members.length === 0 ? (
              <p className="text-sm text-gray-500">{t.teamNoMembers}</p>
            ) : (
              <ul className="divide-y divide-gray-900/[0.06] dark:divide-white/[0.06]">
                {members.map((m) => (
                  <li key={m.userId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{m.name ?? m.email}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoleBadge role={m.role} t={t} />
                      {canManage && m.role !== "owner" && (
                        confirmRemove === m.userId ? (
                          <span className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{t.teamRemoveConfirm}</span>
                            <button onClick={() => remove(m.userId)} className="text-xs font-medium text-red-600 hover:underline">
                              {t.teamRemove}
                            </button>
                            <button onClick={() => setConfirmRemove(null)} className="text-xs text-gray-400 hover:underline">
                              ✕
                            </button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmRemove(m.userId)} className="text-xs text-red-600 hover:underline">
                            {t.teamRemove}
                          </button>
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
                <UserPlus className="h-4 w-4" /> {t.teamInvite}
              </h2>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[140px] flex-1">
                  <label className="mb-1 block text-xs text-gray-500">{t.teamFirstName}</label>
                  <input value={inviteFirst} onChange={(e) => setInviteFirst(e.target.value)} placeholder={t.teamFirstName} className={INPUT} />
                </div>
                <div className="min-w-[140px] flex-1">
                  <label className="mb-1 block text-xs text-gray-500">{t.teamLastName}</label>
                  <input value={inviteLast} onChange={(e) => setInviteLast(e.target.value)} placeholder={t.teamLastName} className={INPUT} />
                </div>
                <div className="min-w-[220px] flex-1">
                  <label className="mb-1 block text-xs text-gray-500">{t.teamInviteEmail}</label>
                  <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="namn@byra.se" className={INPUT} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">{t.teamInviteRole}</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "admin" | "member")} className={INPUT}>
                    <option value="member">{t.teamRoleMember}</option>
                    <option value="admin">{t.teamRoleAdmin}</option>
                  </select>
                </div>
                <button onClick={invite} disabled={inviting || !inviteEmail.trim() || !inviteFirst.trim() || !inviteLast.trim()} className={BTN}>
                  {inviting ? t.loading : t.teamSend}
                </button>
              </div>

              {pending.length > 0 && (
                <div className="mt-5 border-t border-gray-900/[0.06] pt-4 dark:border-white/[0.06]">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">{t.teamPending}</p>
                  <ul className="space-y-2">
                    {pending.map((p) => (
                      <li key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{p.email}</span>
                        <RoleBadge role={p.role} t={t} />
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
      <p className="mb-4 text-xs text-gray-500">{t.teamAssignHint}</p>

      {clients.length === 0 ? (
        <p className="text-sm text-gray-500">{t.clientsEmpty}</p>
      ) : (
        <>
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={`${INPUT} mb-4`}>
            {clients.map((c) => (
              <option key={c.companyId} value={c.companyId}>
                {c.companyName}
              </option>
            ))}
          </select>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">{t.teamAssignedTo}</p>
              {assigned.length === 0 ? (
                <p className="text-sm text-gray-500">{t.teamNoAssignments}</p>
              ) : (
                <ul className="space-y-1.5">
                  {assigned.map((a) => (
                    <li key={a.workerId} className="flex items-center justify-between rounded-lg bg-gray-900/[0.03] px-3 py-2 text-sm dark:bg-white/[0.04]">
                      <span className="text-gray-700 dark:text-gray-200">{a.name ?? a.email}</span>
                      <button onClick={() => unassign(a.workerId)} disabled={busy} className="text-gray-400 hover:text-red-600" aria-label={t.teamUnassign}>
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">{t.teamMembers}</p>
              {assignableWorkers.length === 0 ? (
                <p className="text-sm text-gray-500">{t.teamNoMembers}</p>
              ) : (
                <ul className="space-y-1.5">
                  {assignableWorkers.map((w) => (
                    <li key={w.userId} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm">
                      <span className="text-gray-700 dark:text-gray-200">{w.name ?? w.email}</span>
                      <button onClick={() => assign(w.userId)} disabled={busy} className={BTN_GHOST}>
                        {t.teamAssign}
                      </button>
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
