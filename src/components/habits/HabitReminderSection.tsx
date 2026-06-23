"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api-client";
import {
  HABIT_REMINDER_TIMES,
  parseCronTime,
} from "@/lib/cron";
import type { Habit, Reminder } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HabitReminderSectionProps {
  habit: Habit;
  onUpdate: () => void;
}

export function HabitReminderSection({ habit, onUpdate }: HabitReminderSectionProps) {
  const reminder = habit.reminder;
  const parsed = reminder?.cron_expression ? parseCronTime(reminder.cron_expression) : null;

  const [enabled, setEnabled] = useState(reminder?.enabled ?? false);
  const [hour, setHour] = useState(parsed?.hour ?? 8);
  const [minute, setMinute] = useState(parsed?.minute ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushOk, setPushOk] = useState<boolean | null>(null);

  useEffect(() => {
    setEnabled(reminder?.enabled ?? false);
    if (parsed) {
      setHour(parsed.hour);
      setMinute(parsed.minute);
    }
  }, [reminder?.enabled, reminder?.cron_expression, parsed?.hour, parsed?.minute]);

  useEffect(() => {
    async function checkPush() {
      const { publicKey } = await api.get<{ publicKey: string }>("/api/push/subscribe");
      if (!publicKey) {
        setPushOk(false);
        return;
      }
      if ("serviceWorker" in globalThis.navigator) {
        const reg = await globalThis.navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setPushOk(!!sub);
      } else {
        setPushOk(false);
      }
    }
    void checkPush();
  }, []);

  async function save(nextEnabled: boolean, nextHour = hour, nextMinute = minute) {
    setSaving(true);
    setError(null);
    try {
      await api.put<Reminder>(`/api/habits/${habit.id}/reminder`, {
        enabled: nextEnabled,
        hour: nextHour,
        minute: nextMinute,
      });
      setEnabled(nextEnabled);
      onUpdate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function selectTime(h: number, m: number) {
    setHour(h);
    setMinute(m);
    if (enabled) void save(true, h, m);
  }

  const timeLabel =
    HABIT_REMINDER_TIMES.find((t) => t.hour === hour && t.minute === minute)?.label ??
    `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

  return (
    <div className="rounded-xl border border-border bg-surface-muted/50 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {enabled ? (
            <Bell size={16} className="text-accent" />
          ) : (
            <BellOff size={16} className="text-muted" />
          )}
          <div>
            <p className="text-sm font-medium">Recordatorio push</p>
            <p className="text-[10px] text-muted">
              {enabled ? `Cada día a las ${timeLabel}` : "Sin recordatorio"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={saving}
          onClick={() => save(!enabled)}
        >
          {enabled ? "Off" : "On"}
        </Button>
      </div>

      {enabled && (
        <div className="flex flex-wrap gap-2">
          {HABIT_REMINDER_TIMES.map((t) => (
            <button
              key={t.label}
              type="button"
              disabled={saving}
              onClick={() => selectTime(t.hour, t.minute)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                hour === t.hour && minute === t.minute
                  ? "border-accent-soft bg-accent/10 text-accent"
                  : "border-border text-muted"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {pushOk === false && enabled && (
        <p className="mt-2 text-[10px] text-warning">
          Activa push en Ajustes para recibir el recordatorio con la app cerrada.
        </p>
      )}
      {error && <p className="mt-2 text-[10px] text-danger">{error}</p>}
      {enabled && (
        <p className="mt-2 text-[10px] text-muted">
          Respeta tus días objetivo ({habit.target_days.length}/7).
        </p>
      )}
    </div>
  );
}
