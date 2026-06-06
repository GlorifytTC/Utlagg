import { and, eq, gte, lte, desc, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, receipts, subscriptions, auditLogs } from "@/db/schema";

/** Full Subject Access Request payload for one user (GDPR Art. 15). */
export async function buildSar(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const [userReceipts, subs, logs] = await Promise.all([
    db.select().from(receipts).where(eq(receipts.userId, userId)),
    db.select().from(subscriptions).where(eq(subscriptions.userId, userId)),
    db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt)),
  ]);

  // Never include secrets (password hash, reset/verify tokens).
  const safeUser = { ...user } as Record<string, unknown>;
  delete safeUser.hashedPassword;
  delete safeUser.passwordResetToken;
  delete safeUser.emailVerificationToken;

  return {
    generatedAt: new Date().toISOString(),
    user: safeUser,
    subscriptions: subs,
    receipts: userReceipts,
    auditLogs: logs,
  };
}

/** Skatteverket-style receipt export (CSV) for a date range, with VAT. */
export async function skatteverketCsv(from?: string, to?: string): Promise<string> {
  const conds = [];
  if (from && !Number.isNaN(Date.parse(from))) conds.push(gte(receipts.date, new Date(from)));
  if (to && !Number.isNaN(Date.parse(to))) conds.push(lte(receipts.date, new Date(to)));
  const where = conds.length ? and(...conds) : undefined;

  const rows = await db.select().from(receipts).where(where).orderBy(desc(receipts.date));

  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ["Datum", "Leverantör", "Belopp", "Moms", "Momssats", "BAS-konto", "Kategori"];
  const lines = rows.map((r: Record<string, unknown>) =>
    [
      r.date ? new Date(r.date as string).toISOString().slice(0, 10) : "",
      r.vendorName,
      r.totalAmount,
      r.vatAmount,
      r.vatRate,
      r.basCode,
      r.category,
    ].map(esc).join(";"),
  );
  return "\uFEFF" + [header.join(";"), ...lines].join("\n");
}

/** 7-year retention analysis (Bokföringslagen). */
export async function retentionReport() {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 7);
  const [{ aging }] = (await db
    .select({ aging: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(lt(auditLogs.createdAt, cutoff))) as { aging: number }[];
  return { cutoff: cutoff.toISOString(), recordsOlderThan7y: Number(aging) };
}
