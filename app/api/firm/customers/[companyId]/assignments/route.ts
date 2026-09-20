import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, accountantClients, firmMembers, workerAssignments } from "@/db/schema";
import { requireFirmRole } from "@/lib/accountant";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Customer <-> worker assignments for one customer company. Owner/admin only.
 *
 * GET  — who is assigned to this customer (+ the firm's workers, so the UI can
 *        offer the rest to assign).
 * POST — assign a worker to this customer.
 * DELETE — unassign a worker from this customer.
 *
 * Every action verifies: the customer belongs to the CALLER's firm (active
 * accountant_clients row for firmId+companyId), and the worker is a member of
 * the same firm. So an assignment can never connect a worker to a customer
 * outside their firm, and can never reach another firm's customer.
 */

async function firmOwnsCustomer(firmId: string, companyId: string) {
  const [rel] = await db
    .select({ id: accountantClients.id })
    .from(accountantClients)
    .where(
      and(
        eq(accountantClients.firmId, firmId),
        eq(accountantClients.companyId, companyId),
        eq(accountantClients.status, "active"),
      ),
    )
    .limit(1);
  return Boolean(rel);
}

async function workerInFirm(firmId: string, workerId: string) {
  const [w] = await db
    .select({ id: firmMembers.id })
    .from(firmMembers)
    .where(and(eq(firmMembers.firmId, firmId), eq(firmMembers.userId, workerId)))
    .limit(1);
  return Boolean(w);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { companyId: string } },
) {
  const m = await requireFirmRole("admin");
  if (!m) return NextResponse.json({ error: "Endast ägare/admin." }, { status: 403 });
  if (!(await firmOwnsCustomer(m.firmId, params.companyId))) {
    return NextResponse.json({ error: "Hittades inte" }, { status: 404 });
  }

  const [assigned, firmWorkers] = await Promise.all([
    db
      .select({ workerId: workerAssignments.workerId, name: users.name, email: users.email })
      .from(workerAssignments)
      .innerJoin(users, eq(users.id, workerAssignments.workerId))
      .where(
        and(
          eq(workerAssignments.firmId, m.firmId),
          eq(workerAssignments.companyId, params.companyId),
        ),
      ),
    db
      .select({ userId: firmMembers.userId, name: users.name, email: users.email, role: firmMembers.role })
      .from(firmMembers)
      .innerJoin(users, eq(users.id, firmMembers.userId))
      .where(eq(firmMembers.firmId, m.firmId)),
  ]);

  return NextResponse.json({ assigned, firmWorkers });
}

const bodySchema = z.object({ workerId: z.string().uuid() });

export async function POST(
  req: NextRequest,
  { params }: { params: { companyId: string } },
) {
  const m = await requireFirmRole("admin");
  if (!m) return NextResponse.json({ error: "Endast ägare/admin." }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });
  const { workerId } = parsed.data;

  if (!(await firmOwnsCustomer(m.firmId, params.companyId))) {
    return NextResponse.json({ error: "Kunden tillhör inte din byrå." }, { status: 404 });
  }
  if (!(await workerInFirm(m.firmId, workerId))) {
    return NextResponse.json({ error: "Medarbetaren tillhör inte din byrå." }, { status: 404 });
  }

  // Idempotent: skip if the assignment already exists (unique pair index).
  const [existing] = await db
    .select({ id: workerAssignments.id })
    .from(workerAssignments)
    .where(and(eq(workerAssignments.workerId, workerId), eq(workerAssignments.companyId, params.companyId)))
    .limit(1);
  if (!existing) {
    await db.insert(workerAssignments).values({
      firmId: m.firmId,
      workerId,
      companyId: params.companyId,
      assignedBy: m.userId,
    });
  }

  await logAudit({
    userId: m.userId,
    action: "firm.assignment.add",
    details: `firm ${m.firmId} assigned worker ${workerId} to company ${params.companyId}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { companyId: string } },
) {
  const m = await requireFirmRole("admin");
  if (!m) return NextResponse.json({ error: "Endast ägare/admin." }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });

  // Scope the delete to the caller's firm + this customer, so it can only ever
  // touch this firm's assignments.
  await db
    .delete(workerAssignments)
    .where(
      and(
        eq(workerAssignments.firmId, m.firmId),
        eq(workerAssignments.companyId, params.companyId),
        eq(workerAssignments.workerId, parsed.data.workerId),
      ),
    );

  await logAudit({
    userId: m.userId,
    action: "firm.assignment.remove",
    details: `firm ${m.firmId} unassigned worker ${parsed.data.workerId} from company ${params.companyId}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
