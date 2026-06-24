"use client";

import { useCallback, useMemo, useState } from "react";
import { Film, Play } from "lucide-react";
import type { ExerciseCatalog } from "@/lib/types";
import { cn } from "@/lib/utils";

type MediaFields = Pick<ExerciseCatalog, "demo_gif_url" | "image_url" | "image_urls">;

function uniqueUrls(urls: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
  }
  return result;
}

/** Full demo: GIF first, then still frames. */
export function pickMediaUrl(exercise: MediaFields) {
  return buildMediaCandidates(exercise, false)[0] ?? null;
}

/** Thumbnails: still image first (much smaller than GIF). */
export function pickThumbUrl(exercise: MediaFields) {
  return buildMediaCandidates(exercise, true)[0] ?? null;
}

export function buildMediaCandidates(exercise: MediaFields, preferStill: boolean): string[] {
  const still = uniqueUrls([
    exercise.image_url,
    exercise.image_urls?.["360p"],
    exercise.image_urls?.["480p"],
    exercise.image_urls?.["720p"],
  ]);
  const motion = uniqueUrls([exercise.demo_gif_url]);
  return preferStill ? uniqueUrls([...still, ...motion]) : uniqueUrls([...motion, ...still]);
}

function useMediaWithFallback(candidates: string[]) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const url = candidates[index] ?? null;

  const onError = useCallback(() => {
    setLoaded(false);
    setIndex((current) => (current < candidates.length - 1 ? current + 1 : current));
  }, [candidates.length]);

  const onLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  return { url, loaded, onError, onLoad, hasCandidates: candidates.length > 0 };
}

interface ExerciseMediaProps {
  exercise: Pick<ExerciseCatalog, "name" | "demo_gif_url" | "image_url" | "image_urls" | "video_url">;
  className?: string;
  /** Compact square thumbnail for lists */
  compact?: boolean;
  /** Session stage: always square, no extra chrome */
  session?: boolean;
  /** Legacy wide 16:9 layout */
  wide?: boolean;
  /** Eager load for above-the-fold media */
  priority?: boolean;
}

export function ExerciseMedia({
  exercise,
  className = "",
  compact = false,
  session = false,
  wide = false,
  priority = false,
}: ExerciseMediaProps) {
  const candidates = useMemo(() => buildMediaCandidates(exercise, false), [exercise]);
  const { url, loaded, onError, onLoad } = useMediaWithFallback(candidates);
  const square = compact || session || !wide;

  if (exercise.video_url && !session) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-[20px] border border-border bg-surface-muted",
          className
        )}
      >
        <video
          src={exercise.video_url}
          poster={url ?? undefined}
          controls
          playsInline
          className={cn(
            "w-full object-cover",
            square ? "aspect-square" : "aspect-video"
          )}
        />
      </div>
    );
  }

  if (url) {
    return (
      <div
        className={cn(
          "relative overflow-hidden border border-border bg-surface-muted",
          session ? "rounded-2xl" : "rounded-[20px]",
          className
        )}
      >
        {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={session ? "" : `Demo de ${exercise.name}`}
          className={cn(
            "w-full object-cover transition-opacity duration-300 ease-out",
            square ? "aspect-square" : "aspect-video",
            loaded ? "opacity-100" : "opacity-0"
          )}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={onLoad}
          onError={onError}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 border border-border bg-surface-muted text-center",
        square ? "aspect-square rounded-2xl" : "aspect-video rounded-[20px]",
        session ? "px-3" : "px-6",
        className
      )}
    >
      <Film size={session ? 20 : compact ? 24 : 32} className="text-muted" />
      {!session && (
        <>
          <p className="text-sm font-medium text-secondary">Demo del movimiento</p>
          {!compact && (
            <p className="text-xs text-muted">Sin imagen disponible para este ejercicio</p>
          )}
        </>
      )}
    </div>
  );
}

export function ExerciseMediaThumb({
  exercise,
  className = "",
  priority = false,
}: {
  exercise: Pick<ExerciseCatalog, "name" | "demo_gif_url" | "image_url" | "image_urls">;
  className?: string;
  priority?: boolean;
}) {
  const candidates = useMemo(() => buildMediaCandidates(exercise, true), [exercise]);
  const { url, loaded, onError, onLoad } = useMediaWithFallback(candidates);

  if (!url) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-muted",
          className
        )}
      >
        <Play size={16} className="text-muted" />
      </div>
    );
  }

  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-2xl border border-border", className)}>
      {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className={cn(
          "aspect-square h-full w-full object-cover transition-opacity duration-300 ease-out",
          loaded ? "opacity-100" : "opacity-0"
        )}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        onLoad={onLoad}
        onError={onError}
      />
    </div>
  );
}
