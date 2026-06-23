"use client";

import { Film, Play } from "lucide-react";
import type { ExerciseCatalog } from "@/lib/types";
import { cn } from "@/lib/utils";

export function pickMediaUrl(
  exercise: Pick<ExerciseCatalog, "demo_gif_url" | "image_url" | "image_urls">
) {
  return (
    exercise.demo_gif_url ??
    exercise.image_urls?.["720p"] ??
    exercise.image_urls?.["480p"] ??
    exercise.image_url ??
    exercise.image_urls?.["360p"] ??
    null
  );
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
}

export function ExerciseMedia({
  exercise,
  className = "",
  compact = false,
  session = false,
  wide = false,
}: ExerciseMediaProps) {
  const mediaUrl = pickMediaUrl(exercise);
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
          poster={mediaUrl ?? undefined}
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

  if (mediaUrl) {
    return (
      <div
        className={cn(
          "overflow-hidden border border-border bg-surface-muted",
          session ? "rounded-2xl" : "rounded-[20px]",
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl}
          alt={session ? "" : `Demo de ${exercise.name}`}
          className={cn("w-full object-cover", square ? "aspect-square" : "aspect-video")}
          loading="lazy"
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
            <p className="text-xs text-muted">Sincroniza con ExerciseDB para cargar GIF o imagen</p>
          )}
        </>
      )}
    </div>
  );
}

export function ExerciseMediaThumb({
  exercise,
  className = "",
}: {
  exercise: Pick<ExerciseCatalog, "name" | "demo_gif_url" | "image_url" | "image_urls">;
  className?: string;
}) {
  const mediaUrl = pickMediaUrl(exercise);

  if (!mediaUrl) {
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl}
      alt=""
      className={cn(
        "aspect-square shrink-0 rounded-2xl border border-border object-cover",
        className
      )}
      loading="lazy"
    />
  );
}
