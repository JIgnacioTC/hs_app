import { ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const PRESIGN_EXPIRES_SECONDS = 3600;
const GIF_KEY_PATTERN = /^\d{4}-.+\.gif$/i;

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  );
}

export function getR2BucketName(): string {
  return process.env.R2_BUCKET_NAME?.trim() || "hs-gifs";
}

export function getR2PublicBaseUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_R2_GIF_PUBLIC_URL?.trim();
  return base ? base.replace(/\/$/, "") : null;
}

/** Dataset path `videos/0001-abc.gif` → R2 object key `0001-abc.gif`. */
export function gifDatasetPathToR2Key(relativePath: string): string {
  const path = relativePath.replace(/^\//, "").trim();
  if (path.startsWith("videos/")) return path.slice("videos/".length);
  return path;
}

export function r2GifPublicUrl(key: string): string | null {
  const base = getR2PublicBaseUrl();
  if (!base || !key) return null;
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function normalizeGifFilename(name: string): string | null {
  const base = name.split(/[/\\]/).pop()?.trim() ?? "";
  if (!base || !GIF_KEY_PATTERN.test(base)) return null;
  return base;
}

export function createR2Client(): S3Client {
  const endpoint = process.env.R2_ENDPOINT?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 no configurado: faltan R2_ENDPOINT, R2_ACCESS_KEY_ID o R2_SECRET_ACCESS_KEY");
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function createGifPresignedUploadUrl(
  key: string,
  contentType = "image/gif"
): Promise<string> {
  const client = createR2Client();
  const command = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: PRESIGN_EXPIRES_SECONDS });
}

export async function listBucketGifKeys(): Promise<string[]> {
  const client = createR2Client();
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: getR2BucketName(),
        ContinuationToken: continuationToken,
      })
    );

    for (const item of response.Contents ?? []) {
      if (item.Key?.toLowerCase().endsWith(".gif")) {
        keys.push(item.Key);
      }
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys.sort();
}
