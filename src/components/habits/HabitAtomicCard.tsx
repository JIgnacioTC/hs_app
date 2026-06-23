"use client";

import { Check, Timer, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StreakBadge, WeeklyDots } from "@/components/habits/StreakBadge";
import { FourLawsRow, IdentityChip } from "@/components/habits/FourLawsRow";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HabitAtomicCardProps {
  habit: Habit;
  onComplete: (type: "full" | "two_minute") => void;
  onUndo: () => void;
  expanded?: boolean;
}

export function HabitAtomicCard({
  habit,
  onComplete,
  onUndo,
  expanded = false,
}: HabitAtomicCardProps) {
  const stats = habit.stats;
  const done = stats?.completedToday;
  const twoMin = stats?.todayType === "two_minute";
  const intention =
    habit.implementation_intention ||
    (habit.cue && habit.name ? `Cuando ${habit.cue}, haré ${habit.name}` : habit.name);

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200",
        done && "border-success/20 bg-success/[0.03]"
      )}
    >
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: habit.color }}
              />
              <h3 className={cn("font-medium tracking-tight", done && "text-success")}>
                {habit.name}
              </h3>
            </div>
            {habit.stack_after && (
              <p className="mt-1 text-xs text-muted">
                Después de: <span className="text-secondary">{habit.stack_after.name}</span>
              </p>
            )}
          </div>
          <StreakBadge stats={stats} />
        </div>

        <p className="mb-3 text-sm leading-relaxed text-secondary">{intention}</p>

        {expanded && habit.identity_link && (
          <div className="mb-3">
            <IdentityChip text={habit.identity_link} />
          </div>
        )}

        {expanded && habit.two_minute_version && (
          <p className="mb-3 rounded-xl bg-surface-muted px-3 py-2 text-xs text-muted">
            <span className="grok-label mb-1 block">Regla de 2 min</span>
            {habit.two_minute_version}
          </p>
        )}

        <FourLawsRow habit={habit} compact={!expanded} />

        {stats && (
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <WeeklyDots last7={stats.last7} />
            <span className="font-mono text-xs text-muted">{stats.completionRate7d}% · 7d</span>
          </div>
        )}
      </div>

      <div className="flex border-t border-border">
        {done ? (
          <button
            type="button"
            onClick={onUndo}
            className="flex flex-1 items-center justify-center gap-2 py-3.5 text-sm text-secondary transition-colors hover:bg-surface-muted"
          >
            <Check size={16} className="text-success" />
            {twoMin ? "2 min hecho" : "Completado"} · deshacer
          </button>
        ) : (
          <>
            {habit.two_minute_version && (
              <button
                type="button"
                onClick={() => onComplete("two_minute")}
                className="flex flex-1 items-center justify-center gap-2 border-r border-border py-3.5 text-sm text-secondary transition-colors hover:bg-surface-muted hover:text-accent"
              >
                <Timer size={16} />
                2 min
              </button>
            )}
            <button
              type="button"
              onClick={() => onComplete("full")}
              className="flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-medium text-accent transition-colors hover:bg-accent/5"
            >
              <Zap size={16} />
              Completar
            </button>
          </>
        )}
      </div>
    </Card>
  );
}
