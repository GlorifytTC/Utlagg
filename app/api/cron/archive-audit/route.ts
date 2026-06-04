import { NextResponse, type NextRequest } from "next/server";
import { lt } from "drizzle-orm";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { isStorageConfigured } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Archive audit logs older than 6 months to R2 cold storage as JSONL.
 *
 * Deliberately COPY-ONLY: we never delete audit rows. Bokföringslagen requires
 * 7-year retention and immediate reproducibility, so the legal record stays in
 * the primary DB; the R2 copy is a redundant backup, not a tombstone.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 6);

  const rows = await db
    .select()
    .from(auditLogs)
    .where(lt(auditLogs.createdAt, cutoff));

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, archived: 0 });
  }

  // FIXED: Added type annotation for 'r'
  const jsonl = rows.map((r: typeof auditLogs.$inferSelect) => JSON.stringify(r)).join("\n");
  
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  const key = `audit-archive/${new Date().toISOString().slice(0, 10)}.jsonl`;

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: jsonl,
      ContentType: "application/x-ndjson",
    }),
  );

  return NextResponse.json({ ok: true, archived: rows.length, key });
}