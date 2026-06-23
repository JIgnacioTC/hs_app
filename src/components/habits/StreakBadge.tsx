import { cn } from "@/lib/utils";
import type { HabitStats } from "@/lib/types";

export function StreakBadge({
  stats,
  className,
}: {
  stats?: HabitStats;
  className?: string;
}) {
  if (!stats) return null;
  const { currentStreak, bestStreak } = stats;

  if (currentStreak === 0 && bestStreak === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {currentStreak > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <span className="animate-streak">●</span>
          {currentStreak}d racha
        </span>
      )}
      {bestStreak > currentStreak && (
        <span className="text-xs text-muted">Mejor: {bestStreak}d</span>
      )}
    </div>
  );
}

export function WeeklyDots({ last7 }: { last7: boolean[] }) {
  const labels = ["L", "M", "X", "J", "V", "S", "D"];
  return (
    <div className="flex gap-1">
      {last7.map((done, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              done ? "bg-success" : "bg-surface-muted"
            )}
          />
          <span className="text-[9px] text-muted">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
