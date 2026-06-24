import { gifDatasetPathToR2Key, r2GifPublicUrl } from "@/lib/gym/exercise-dataset/r2";

/** Primary CDN for still images (hasaneyldrm/exercises-dataset via jsDelivr). */
export const DATASET_CDN_BASE =
  "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main";

/** Secondary CDN fallback for still images when jsDelivr is slow. */
export const DATASET_GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main";

export type ExerciseMediaProvider = "supabase" | "cdn" | "r2";

function isGifPath(path: string): boolean {
  const normalized = path.toLowerCase();
  return normalized.startsWith("videos/") || normalized.endsWith(".gif");
}

/** Still images default to CDN; set NEXT_PUBLIC_EXERCISE_MEDIA_PROVIDER=supabase to use Storage. */
export function getExerciseMediaProvider(): ExerciseMediaProvider {
  const configured = process.env.NEXT_PUBLIC_EXERCISE_MEDIA_PROVIDER;
  if (configured === "supabase") return "supabase";
  return "cdn";
}

/** GIFs are served exclusively from Cloudflare R2. */
export function getGifMediaProvider(): ExerciseMediaProvider {
  return "r2";
}

function providerForPath(relativePath: string): ExerciseMediaProvider {
  return isGifPath(relativePath) ? getGifMediaProvider() : getExerciseMediaProvider();
}

function supabaseProjectUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? null;
}

/** Public object URL: …/storage/v1/object/public/{bucket}/{key} */
export function supabaseStoragePublicUrl(bucket: string, objectKey: string): string | null {
  const base = supabaseProjectUrl();
  if (!base || !objectKey) return null;
  const encoded = objectKey
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}

export function resolveDatasetStoragePath(relativePath: string): {
  bucket: string;
  key: string;
} | null {
  const path = relativePath.replace(/^\//, "").trim();
  if (!path) return null;

  const imagesBucket =
    process.env.NEXT_PUBLIC_SUPABASE_EXERCISE_IMAGES_BUCKET ?? "images";
  const videosBucket =
    process.env.NEXT_PUBLIC_SUPABASE_EXERCISE_VIDEOS_BUCKET ?? imagesBucket;

  if (path.startsWith("images/")) {
    return { bucket: imagesBucket, key: path.slice("images/".length) };
  }
  if (path.startsWith("videos/")) {
    return { bucket: videosBucket, key: path.slice("videos/".length) };
  }

  return { bucket: imagesBucket, key: path };
}

export function datasetMediaUrl(relativePath: string | null | undefined): string | null {
  const urls = datasetMediaUrls(relativePath);
  return urls[0] ?? null;
}

/**
 * GIFs: R2 only (no dataset CDN).
 * Still images: optional Supabase, then jsDelivr, then GitHub raw.
 */
export function datasetMediaUrls(relativePath: string | null | undefined): string[] {
  if (!relativePath?.trim()) return [];

  const path = relativePath.replace(/^\//, "");

  if (isGifPath(path)) {
    const r2Url = r2GifPublicUrl(gifDatasetPathToR2Key(path));
    return r2Url ? [r2Url] : [];
  }

  const provider = providerForPath(path);
  const urls: string[] = [];

  if (provider === "supabase") {
    const resolved = resolveDatasetStoragePath(relativePath);
    if (resolved) {
      const url = supabaseStoragePublicUrl(resolved.bucket, resolved.key);
      if (url) urls.push(url);
    }
  }

  urls.push(`${DATASET_CDN_BASE}/${path}`);
  urls.push(`${DATASET_GITHUB_RAW_BASE}/${path}`);

  return [...new Set(urls)];
}

export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const base = supabaseProjectUrl();
  return !!base && url.startsWith(`${base}/storage/v1/object/public/`);
}

export function isR2GifUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const base = process.env.NEXT_PUBLIC_R2_GIF_PUBLIC_URL?.replace(/\/$/, "");
  return !!base && url.startsWith(`${base}/`);
}
