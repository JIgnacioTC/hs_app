import { CronExpressionParser } from "cron-parser";

export function shouldSendReminder(
  cronExpression: string,
  timezone: string,
  lastSentAt: string | null,
  now = new Date()
): boolean {
  try {
    const interval = CronExpressionParser.parse(cronExpression, {
      currentDate: now,
      tz: timezone,
    });

    const prev = interval.prev().toDate();
    const windowMs = 5 * 60 * 1000;

    if (!lastSentAt) {
      return now.getTime() - prev.getTime() <= windowMs;
    }

    const last = new Date(lastSentAt);
    return prev.getTime() > last.getTime() && now.getTime() - prev.getTime() <= windowMs;
  } catch {
    return false;
  }
}

export const CRON_PRESETS = [
  { label: "Cada mañana 8:00", value: "0 8 * * *" },
  { label: "Mediodía 12:00", value: "0 12 * * *" },
  { label: "Tarde 18:00", value: "0 18 * * *" },
  { label: "Noche 21:00", value: "0 21 * * *" },
  { label: "Lunes-Viernes 7:00", value: "0 7 * * 1-5" },
  { label: "Personalizado", value: "custom" },
] as const;

export function describeCron(cron: string): string {
  const preset = CRON_PRESETS.find((p) => p.value === cron);
  if (preset) return preset.label;
  return cron;
}

/** targetDays: 0=Dom … 6=Sáb (JS getDay) */
export function timeAndDaysToCron(hour: number, minute: number, targetDays: number[]): string {
  const sorted = [...targetDays].sort((a, b) => a - b);
  const days =
    sorted.length === 7 || sorted.length === 0 ? "*" : sorted.join(",");
  return `${minute} ${hour} * * ${days}`;
}

export function parseCronTime(cron: string): { hour: number; minute: number } | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const minute = parseInt(parts[0], 10);
  const hour = parseInt(parts[1], 10);
  if (!Number.isFinite(minute) || !Number.isFinite(hour)) return null;
  return { hour, minute };
}

export const HABIT_REMINDER_TIMES = [
  { label: "7:00", hour: 7, minute: 0 },
  { label: "8:00", hour: 8, minute: 0 },
  { label: "12:00", hour: 12, minute: 0 },
  { label: "18:00", hour: 18, minute: 0 },
  { label: "21:00", hour: 21, minute: 0 },
] as const;

export function reminderDeepLink(linkedType: string | null, linkedId: string | null): string {
  if (linkedType === "gym") return "/gym";
  if (linkedType === "habit") return linkedId ? `/habits?focus=${linkedId}` : "/habits";
  return "/";
}
