import { addDays, startOfWeek } from "date-fns";
import { localDateKey } from "@/lib/utils";

export const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"] as const;

export interface WeekDayStat {
  date: Date;
  label: (typeof WEEKDAY_LABELS)[number];
  done: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export function buildCurrentWeekStats(
  completedDates: Set<string>,
  today = new Date()
): WeekDayStat[] {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const todayKey = localDateKey(today);

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const key = localDateKey(date);
    return {
      date,
      label: WEEKDAY_LABELS[i],
      done: completedDates.has(key),
      isToday: key === todayKey,
      isFuture: key > todayKey,
    };
  });
}
