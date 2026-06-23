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
