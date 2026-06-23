"use client";

import { Film, Play } from "lucide-react";
import type { ExerciseCatalog } from "@/lib/types";

function pickMediaUrl(exercise: Pick<ExerciseCatalog, "demo_gif_url" | "image_url" | "image_urls">) {
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
  compact?: boolean;
}

export function ExerciseMedia({ exercise, className = "", compact = false }: ExerciseMediaProps) {
  const mediaUrl = pickMediaUrl(exercise);

  if (exercise.video_url) {
    return (
      <div className={`overflow-hidden rounded-[20px] border border-border bg-surface-muted ${className}`}>
        <video
          src={exercise.video_url}
          poster={mediaUrl ?? undefined}
          controls
          playsInline
          className={compact ? "aspect-square w-full object-cover" : "aspect-video w-full object-cover"}
        />
      </div>
    );
  }

  if (mediaUrl) {
    return (
      <div className={`overflow-hidden rounded-[20px] border border-border bg-surface-muted ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl}
          alt={`Demo de ${exercise.name}`}
          className={compact ? "aspect-square w-full object-cover" : "aspect-video w-full object-cover"}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 border border-border bg-surface-muted px-6 text-center ${compact ? "aspect-square rounded-2xl" : "aspect-video rounded-[20px]"} ${className}`}
    >
      <Film size={compact ? 24 : 32} className="text-muted" />
      <p className="text-sm font-medium text-secondary">Demo del movimiento</p>
      {!compact && (
        <p className="text-xs text-muted">Sincroniza con ExerciseDB para cargar GIF o imagen</p>
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
        className={`flex shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-muted ${className}`}
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
      className={`shrink-0 rounded-2xl border border-border object-cover ${className}`}
      loading="lazy"
    />
  );
}
