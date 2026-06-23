import { cn } from "@/lib/utils";

interface MuscleTagsProps {
  targetMuscles?: string[];
  secondaryMuscles?: string[];
  bodyParts?: string[];
  className?: string;
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function MuscleTags({
  targetMuscles = [],
  secondaryMuscles = [],
  bodyParts = [],
  className,
}: MuscleTagsProps) {
  const hasContent =
    targetMuscles.length > 0 || secondaryMuscles.length > 0 || bodyParts.length > 0;

  if (!hasContent) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {bodyParts.length > 0 && (
        <div>
          <p className="grok-label mb-2">Zonas</p>
          <div className="flex flex-wrap gap-2">
            {bodyParts.map((part) => (
              <span
                key={part}
                className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs text-secondary"
              >
                {titleCase(part)}
              </span>
            ))}
          </div>
        </div>
      )}

      {targetMuscles.length > 0 && (
        <div>
          <p className="grok-label mb-2">Músculos principales</p>
          <div className="flex flex-wrap gap-2">
            {targetMuscles.map((muscle) => (
              <span
                key={muscle}
                className="rounded-full border border-accent-soft bg-accent/10 px-3 py-1 text-xs text-accent"
              >
                {titleCase(muscle)}
              </span>
            ))}
          </div>
        </div>
      )}

      {secondaryMuscles.length > 0 && (
        <div>
          <p className="grok-label mb-2">Músculos secundarios</p>
          <div className="flex flex-wrap gap-2">
            {secondaryMuscles.map((muscle) => (
              <span
                key={muscle}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted"
              >
                {titleCase(muscle)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
