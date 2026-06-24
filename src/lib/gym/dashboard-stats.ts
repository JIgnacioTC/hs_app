import { startOfWeek, subDays } from "date-fns";
import { localDateKey } from "@/lib/utils";
import type { GymSession } from "@/lib/types";

export function completedSessionDates(sessions: GymSession[]): Set<string> {
  return new Set(
    sessions
      .filter((s) => s.status === "completed" && s.completed_at)
      .map((s) => localDateKey(s.completed_at!))
  );
}

export function computeTrainingStreak(dates: Set<string>, today = new Date()): number {
  const todayKey = localDateKey(today);
  let cursor = dates.has(todayKey) ? today : subDays(today, 1);
  let streak = 0;

  while (dates.has(localDateKey(cursor))) {
    streak++;
    cursor = subDays(cursor, 1);
    if (streak > 365) break;
  }

  return streak;
}

export function sessionsThisWeek(sessions: GymSession[], today = new Date()): number {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const startKey = localDateKey(weekStart);
  return sessions.filter(
    (s) =>
      s.status === "completed" &&
      s.completed_at &&
      localDateKey(s.completed_at) >= startKey
  ).length;
}

export function lastCompletedSession(sessions: GymSession[]): GymSession | null {
  return (
    sessions
      .filter((s) => s.status === "completed" && s.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0] ??
    null
  );
}

export function activeSession(sessions: GymSession[]): GymSession | null {
  return sessions.find((s) => s.status === "active") ?? null;
}
