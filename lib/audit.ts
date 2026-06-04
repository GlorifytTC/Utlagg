import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { NextRequest } from "next/server";

/**
 * Append an immutable audit-log entry. Required for Bokföringslagen — these
 * rows must be retained for 7 years and should never be updated or deleted by
 * application code. (Enforce retention at the DB/backup layer too.)
 */
export async function logAudit(params: {
  userId: string | null;
  action: string;
  details?: string;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId,
      action: params.action,
      details: params.details,
      ipAddress: params.ipAddress ?? null,
    });
  } catch (err) {
    // Never let audit failure break the user action, but do surface it.
    console.error("audit log failed:", err);
  }
}

export function clientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

/**
 * Richer audit entry with before/after snapshots and user-agent. Uses the
 * nullable columns added in phase 3. The simpler logAudit() above still works;
 * prefer this one when you have entity context or value diffs.
 */
export async function logAuditEvent(params: {
  userId: string | null;
  action: string;
  entityType?: string;
  entityId?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
  details?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      // jsonb columns; round-trip through JSON to drop non-serialisable values.
      oldValues:
        params.oldValues === undefined
          ? null
          : JSON.parse(JSON.stringify(params.oldValues)),
      newValues:
        params.newValues === undefined
          ? null
          : JSON.parse(JSON.stringify(params.newValues)),
      details: params.details,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    });
  } catch (err) {
    console.error("audit log failed:", err);
  }
}
