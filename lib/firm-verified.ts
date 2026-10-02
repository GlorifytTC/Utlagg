import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { firmMembers, users } from "@/db/schema";

/** A firm is verified only when every one of its members is an approved accountant. */
export async function verifiedFirmIds(firmIds: string[]): Promise<Set<string>> {
  if (!firmIds.length) return new Set();
  const rows = (await db
    .select({ firmId: firmMembers.firmId })
    .from(firmMembers)
    .innerJoin(users, eq(users.id, firmMembers.userId))
    .where(inArray(firmMembers.firmId, firmIds))
    .groupBy(firmMembers.firmId)
    .having(sql`bool_and(${users.verificationStatus} = 'approved')`)) as { firmId: string }[];
  return new Set(rows.map((r) => r.firmId));
}
