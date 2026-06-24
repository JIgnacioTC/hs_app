import { gifDatasetPathToR2Key, r2GifPublicUrl } from "@/lib/gym/exercise-dataset/r2";

/** Primary CDN (hasaneyldrm/exercises-dataset via jsDelivr). */
export const DATASET_CDN_BASE =
  "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main";

/** Secondary CDN fallback when jsDelivr is slow or unavailable. */
export const DATASET_GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main";

export type ExerciseMediaProvider = "supabase" | "cdn" | "r2";

/** Images default to CDN; set NEXT_PUBLIC_EXERCISE_MEDIA_PROVIDER=supabase to use Storage. */
export function getExerciseMediaProvider(): ExerciseMediaProvider {
  const configured = process.env.NEXT_PUBLIC_EXERCISE_MEDIA_PROVIDER;
  if (configured === "supabase") return "supabase";
  return "cdn";
}

/** GIFs: R2 when public URL is set, else CDN unless NEXT_PUBLIC_EXERCISE_GIF_PROVIDER overrides. */
export function getGifMediaProvider(): ExerciseMediaProvider {
  const configured = process.env.NEXT_PUBLIC_EXERCISE_GIF_PROVIDER;
  if (configured === "r2") return "r2";
  if (configured === "cdn") return "cdn";
  if (configured === "supabase") return "supabase";
  if (process.env.NEXT_PUBLIC_R2_GIF_PUBLIC_URL?.trim()) return "r2";
  return "cdn";
}

function providerForPath(relativePath: string): ExerciseMediaProvider {
  const path = relativePath.replace(/^\//, "").toLowerCase();
  const isGif = path.startsWith("videos/") || path.endsWith(".gif");
  return isGif ? getGifMediaProvider() : getExerciseMediaProvider();
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

/**
 * Maps dataset paths to Supabase Storage keys.
 * Dataset: `images/0001-abc.jpg` → bucket `images`, key `0001-abc.jpg`
 * Dataset: `videos/0001-abc.gif` → bucket `videos` (or same as images), key `0001-abc.gif`
 */
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

/** Ordered candidates: R2/Supabase (if configured), then jsDelivr, then GitHub raw. */
export function datasetMediaUrls(relativePath: string | null | undefined): string[] {
  if (!relativePath?.trim()) return [];

  const path = relativePath.replace(/^\//, "");
  const provider = providerForPath(path);
  const urls: string[] = [];

  if (provider === "r2") {
    const r2Url = r2GifPublicUrl(gifDatasetPathToR2Key(path));
    if (r2Url) urls.push(r2Url);
  }

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
