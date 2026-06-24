/** Fallback CDN (hasaneyldrm/exercises-dataset). */
export const DATASET_CDN_BASE =
  "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main";

export type ExerciseMediaProvider = "supabase" | "cdn" | "auto";

export function getExerciseMediaProvider(): ExerciseMediaProvider {
  const configured = process.env.NEXT_PUBLIC_EXERCISE_MEDIA_PROVIDER;
  if (configured === "cdn") return "cdn";
  if (configured === "supabase") return "supabase";
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return "supabase";
  return "cdn";
}

/** GIFs are large; default CDN unless NEXT_PUBLIC_EXERCISE_GIF_PROVIDER=supabase */
export function getGifMediaProvider(): ExerciseMediaProvider {
  const configured = process.env.NEXT_PUBLIC_EXERCISE_GIF_PROVIDER;
  if (configured === "cdn") return "cdn";
  if (configured === "supabase") return "supabase";
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
  if (!relativePath?.trim()) return null;

  const path = relativePath.replace(/^\//, "");
  const provider = providerForPath(path);

  if (provider === "supabase") {
    const resolved = resolveDatasetStoragePath(relativePath);
    if (resolved) {
      const url = supabaseStoragePublicUrl(resolved.bucket, resolved.key);
      if (url) return url;
    }
  }

  return `${DATASET_CDN_BASE}/${path}`;
}

export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const base = supabaseProjectUrl();
  return !!base && url.startsWith(`${base}/storage/v1/object/public/`);
}
