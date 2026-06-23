import { addDays, format, parseISO, subDays } from "date-fns";

export interface HabitLogEntry {
  log_date: string;
  completed: boolean;
  completion_type?: "full" | "two_minute";
}

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  completionRate7d: number;
  last7: boolean[];
  missedYesterday: boolean;
  completedToday: boolean;
  todayType?: "full" | "two_minute";
}

function dateStr(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function isScheduledDay(date: Date, targetDays: number[]) {
  return targetDays.includes(date.getDay());
}

export function computeHabitStats(
  logs: HabitLogEntry[],
  targetDays: number[],
  today = new Date()
): HabitStats {
  const completedDates = new Set(
    logs.filter((l) => l.completed).map((l) => l.log_date)
  );

  const todayKey = dateStr(today);
  const todayLog = logs.find((l) => l.log_date === todayKey && l.completed);
  const completedToday = !!todayLog;

  const yesterday = subDays(today, 1);
  const yesterdayKey = dateStr(yesterday);
  const missedYesterday =
    isScheduledDay(yesterday, targetDays) && !completedDates.has(yesterdayKey);

  const last7: boolean[] = [];
  let completed7 = 0;
  let scheduled7 = 0;

  for (let i = 6; i >= 0; i--) {
    const d = subDays(today, i);
    const key = dateStr(d);
    if (isScheduledDay(d, targetDays)) {
      scheduled7++;
      const done = completedDates.has(key);
      if (done) completed7++;
      last7.push(done);
    } else {
      last7.push(false);
    }
  }

  let currentStreak = 0;
  let cursor = today;
  if (!completedDates.has(todayKey) && isScheduledDay(today, targetDays)) {
    cursor = subDays(today, 1);
  }

  while (true) {
    const key = dateStr(cursor);
    if (!isScheduledDay(cursor, targetDays)) {
      cursor = subDays(cursor, 1);
      continue;
    }
    if (!completedDates.has(key)) break;
    currentStreak++;
    cursor = subDays(cursor, 1);
    if (currentStreak > 365) break;
  }

  let bestStreak = 0;
  let run = 0;
  const allDates = [...completedDates].sort();
  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      const prev = parseISO(allDates[i - 1]);
      const curr = parseISO(allDates[i]);
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      run = diff <= 7 ? run + 1 : 1;
    }
    bestStreak = Math.max(bestStreak, run);
  }
  bestStreak = Math.max(bestStreak, currentStreak);

  return {
    currentStreak,
    bestStreak,
    completionRate7d: scheduled7 ? Math.round((completed7 / scheduled7) * 100) : 0,
    last7,
    missedYesterday,
    completedToday,
    todayType: todayLog?.completion_type,
  };
}

export function buildImplementationIntention(cue: string, action: string) {
  const c = cue.trim();
  const a = action.trim();
  if (!c || !a) return "";
  return `Cuando ${c}, haré ${a}`;
}

export { addDays, dateStr, subDays };
