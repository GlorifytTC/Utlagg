import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
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

/**
 * True when a stored `receipts.imageUrl` is an R2 object key we own (rather than
 * an inline base64 data URL or an external http URL). Only these need an R2
 * delete when the receipt row goes away.
 */
export function isR2Key(imageUrl: string | null | undefined): imageUrl is string {
  return Boolean(imageUrl && imageUrl.startsWith("receipts/"));
}

/**
 * Best-effort R2 cleanup for a stored imageUrl. Safe to call with any imageUrl
 * shape (or null) and when storage isn't configured — it no-ops rather than
 * throwing, so it can't break the DB delete it accompanies.
 */
export async function deleteReceiptImageIfR2(
  imageUrl: string | null | undefined,
): Promise<void> {
  if (!isR2Key(imageUrl) || !isStorageConfigured()) return;
  try {
    await deleteReceiptImage(imageUrl);
  } catch (err) {
    console.error("R2 image delete failed for", imageUrl, err);
  }
}

/**
 * Purge every stored image under a user's prefix (`receipts/<userId>/`).
 * Used when an account is deleted: the DB rows cascade away, but their R2
 * objects would otherwise be orphaned. Best-effort and paginated.
 */
export async function deleteAllUserImages(userId: string): Promise<void> {
  if (!isStorageConfigured()) return;
  const client = getClient();
  const prefix = `receipts/${userId}/`;
  try {
    let token: string | undefined;
    do {
      const listed = await client.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: prefix,
          ContinuationToken: token,
        }),
      );
      const keys = (listed.Contents ?? [])
        .map((o) => o.Key)
        .filter((k): k is string => Boolean(k));
      if (keys.length > 0) {
        await client.send(
          new DeleteObjectsCommand({
            Bucket: BUCKET,
            Delete: { Objects: keys.map((Key) => ({ Key })) },
          }),
        );
      }
      token = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (token);
  } catch (err) {
    console.error("R2 bulk delete failed for user", userId, err);
  }
}

/**
 * Turn a stored `receipts.imageUrl` into something an <img> can display.
 *
 * Historically the column has held two shapes:
 *   - a self-contained base64 `data:image/...` URL (current uploader flow), or
 *   - an R2 object KEY like `receipts/<userId>/<id>.jpg` (private bucket).
 * Data URLs and plain http(s) URLs pass through unchanged; R2 keys are minted
 * into a short-lived presigned URL, but only for the owner. Returns null when
 * there's no image or the key isn't the caller's to read.
 */
export async function resolveReceiptImageSrc(
  imageUrl: string | null | undefined,
  userId: string,
): Promise<string | null> {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("data:") || imageUrl.startsWith("http")) return imageUrl;
  if (imageUrl.startsWith("receipts/")) {
    if (!isStorageConfigured() || !keyBelongsToUser(imageUrl, userId)) return null;
    try {
      return await getSignedReceiptUrl(imageUrl);
    } catch {
      return null;
    }
  }
  return null;
}
