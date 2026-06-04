import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 (S3-compatible) storage for receipt images.
 *
 * IMPORTANT — privacy: receipts are financial PII. The spec's original draft
 * made the bucket public (anyone with the URL could read any customer's
 * receipt). We DO NOT do that. Objects stay private; we store the object KEY in
 * receipts.imageUrl and mint short-lived presigned URLs only for the owner.
 */

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const BUCKET = process.env.R2_BUCKET_NAME;

function getClient(): S3Client {
  if (
    !ACCOUNT_ID ||
    !BUCKET ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY
  ) {
    throw new Error(
      "R2 storage is not configured (set R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).",
    );
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export function isStorageConfigured(): boolean {
  return Boolean(
    ACCOUNT_ID &&
      BUCKET &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY,
  );
}

/** Accepts a raw base64 string or a `data:image/...;base64,...` data URL. */
function decodeImage(input: string): { buffer: Buffer; contentType: string } {
  const match = /^data:(image\/[a-zA-Z.+-]+);base64,(.*)$/s.exec(input);
  if (match) {
    return { buffer: Buffer.from(match[2], "base64"), contentType: match[1] };
  }
  // No data-URL prefix: treat the whole thing as base64, assume JPEG.
  return { buffer: Buffer.from(input, "base64"), contentType: "image/jpeg" };
}

function extFor(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("heic")) return "heic";
  return "jpg";
}

/**
 * Upload a receipt image. Returns the object key — store THIS in
 * receipts.imageUrl. Use getSignedReceiptUrl(key) to display it.
 */
export async function uploadReceiptImage(
  userId: string,
  receiptId: string,
  base64Image: string,
): Promise<{ key: string }> {
  const client = getClient();
  const { buffer, contentType } = decodeImage(base64Image);
  const key = `receipts/${userId}/${receiptId}.${extFor(contentType)}`;

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        userId,
        receiptId,
        uploadedAt: new Date().toISOString(),
      },
    }),
  );

  return { key };
}

/** Ownership guard: a key must live under the requesting user's prefix. */
export function keyBelongsToUser(key: string, userId: string): boolean {
  return key.startsWith(`receipts/${userId}/`);
}

/** Short-lived (default 5 min) presigned GET URL for the owner to view. */
export async function getSignedReceiptUrl(
  key: string,
  expiresInSeconds = 300,
): Promise<string> {
  const client = getClient();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: expiresInSeconds },
  );
}

export async function deleteReceiptImage(key: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
