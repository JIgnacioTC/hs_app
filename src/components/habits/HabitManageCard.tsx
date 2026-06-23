"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StreakBadge, WeeklyDots } from "@/components/habits/StreakBadge";
import { FourLawsRow, IdentityChip } from "@/components/habits/FourLawsRow";
import { HabitReminderSection } from "@/components/habits/HabitReminderSection";
import type { Habit } from "@/lib/types";
import { cn, DAYS_SHORT } from "@/lib/utils";

export function HabitManageCard({
  habit,
  expanded,
  onToggle,
  onDelete,
  onUpdate,
}: {
  habit: Habit;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate?: () => void;
}) {
  const intention =
    habit.implementation_intention ||
    (habit.cue ? `Cuando ${habit.cue}, haré ${habit.name}` : habit.name);

  return (
    <Card className="overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: habit.color }} />
              <h3 className="font-medium">{habit.name}</h3>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px]",
                  (habit.habit_kind ?? "build") === "build"
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                )}
              >
                {(habit.habit_kind ?? "build") === "build" ? "+" : "−"}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-secondary">{intention}</p>
          </div>
          {expanded ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <StreakBadge stats={habit.stats} />
          {habit.stats && <WeeklyDots last7={habit.stats.last7} />}
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
          {habit.identity_link && <IdentityChip text={habit.identity_link} />}
          {habit.two_minute_version && (
            <p className="rounded-xl bg-surface-muted px-3 py-2 text-xs text-muted">
              <span className="grok-label mb-1 block">2 min</span>
              {habit.two_minute_version}
            </p>
          )}
          {habit.reward && (
            <p className="text-xs text-accent-soft">Recompensa: {habit.reward}</p>
          )}
          {habit.stack_after && (
            <p className="text-xs text-muted">Apilado después de: {habit.stack_after.name}</p>
          )}
          <FourLawsRow habit={habit} />
          <HabitReminderSection habit={habit} onUpdate={() => onUpdate?.()} />
          <p className="text-xs text-muted">
            {habit.target_days.map((d) => DAYS_SHORT[d]).join(" · ")}
          </p>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-danger hover:underline"
          >
            Archivar hábito
          </button>
        </div>
      )}
    </Card>
  );
}
