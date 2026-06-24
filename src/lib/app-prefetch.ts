"use client";

import { peekCached } from "@/lib/api-cache";
import { api } from "@/lib/api-client";
import type { ExerciseCatalog } from "@/lib/types";

const warmedImages = new Set<string>();

export function prefetchImageUrls(urls: Iterable<string>, limit = 32): void {
  let count = 0;
  for (const url of urls) {
    if (!url || warmedImages.has(url)) continue;
    warmedImages.add(url);
    count += 1;
    void fetch(url).catch(() => {});
    if (count >= limit) break;
  }
}

function thumbUrl(
  exercise: Pick<ExerciseCatalog, "demo_gif_url" | "image_url" | "image_urls">
): string | null {
  return (
    exercise.image_url ??
    exercise.image_urls?.["360p"] ??
    exercise.image_urls?.["480p"] ??
    exercise.demo_gif_url ??
    null
  );
}

/** Critical APIs for instant tab switches after cold start. */
export const CRITICAL_API_PATHS = [
  "/api/profile",
  "/api/gym/routines",
  "/api/gym/sessions",
  "/api/social/feed",
  "/api/reminders",
  "/api/gym/catalog/muscle-groups/media",
] as const;

export const TAB_ROUTES = ["/", "/gym", "/social", "/settings"] as const;

export function hasWarmAppCache(): boolean {
  return (
    peekCached("/api/profile") !== null &&
    peekCached("/api/gym/routines") !== null &&
    peekCached("/api/gym/sessions") !== null
  );
}

function prefetchCatalogThumbs(catalog: ExerciseCatalog[]): void {
  const urls = catalog
    .slice(0, 40)
    .map((exercise) => thumbUrl(exercise))
    .filter((url): url is string => Boolean(url));
  prefetchImageUrls(urls, 40);
}

/** Prefetch all critical data + catalog + exercise thumbnails. */
export async function warmAppCache(): Promise<void> {
  await Promise.allSettled(CRITICAL_API_PATHS.map((path) => api.get(path)));

  const catalogResult = await Promise.allSettled([api.get<ExerciseCatalog[]>("/api/gym/catalog")]);

  if (catalogResult[0].status === "fulfilled") {
    prefetchCatalogThumbs(catalogResult[0].value);
  }
}

/** Fire-and-forget warm cache (safe on any screen). */
export function warmAppCacheInBackground(): void {
  void warmAppCache();
}

export function prefetchTabApis(href: string): void {
  if (href === "/") {
    void api.getStale("/api/profile");
    void api.getStale("/api/gym/routines");
    void api.getStale("/api/gym/sessions");
    return;
  }
  if (href === "/gym") {
    void api.getStale("/api/gym/routines");
    void api.getStale("/api/gym/sessions");
    void api.getStale("/api/gym/catalog");
    void api.getStale("/api/gym/catalog/muscle-groups/media");
    return;
  }
  if (href === "/settings") {
    void api.getStale("/api/profile");
    void api.getStale("/api/reminders");
    return;
  }
  if (href === "/social") {
    void api.getStale("/api/social/feed");
  }
}
