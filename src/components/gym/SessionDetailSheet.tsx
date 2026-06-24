"use client";

import { ArrowLeft, Calendar } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { SetLog } from "@/lib/gym/sets";
import type { GymSession } from "@/lib/types";

type SessionDetail = GymSession & {
  gym_routines?: { name?: string; gym_exercises?: Array<{ id: string; name: string }> };
  set_logs?: SetLog[];
};

interface SessionDetailSheetProps {
  session: SessionDetail;
  onClose: () => void;
}

export function SessionDetailSheet({ session, onClose }: SessionDetailSheetProps) {
  const started = new Date(session.started_at);
  const duration =
    session.completed_at && session.started_at
      ? Math.round(
          (new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) /
            60000
        )
      : null;

  const logs = [...(session.set_logs ?? [])].sort((a, b) =>
    a.completed_at.localeCompare(b.completed_at)
  );

  const byExercise = new Map<string, SetLog[]>();
  for (const log of logs) {
    const key = log.gym_exercise_id ?? log.exercise_catalog_id ?? log.id;
    const list = byExercise.get(key) ?? [];
    list.push(log);
    byExercise.set(key, list);
  }

  const exerciseNames = new Map<string, string>();
  for (const ex of session.gym_routines?.gym_exercises ?? []) {
    exerciseNames.set(ex.id, ex.name);
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-4 pt-safe">
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="grok-label">Detalle de sesión</p>
          <p className="truncate font-medium">{session.gym_routines?.name ?? "Sesión"}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <Card className="mb-4 flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <Calendar size={18} className="text-accent-soft" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {started.toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-xs text-muted">
              {duration != null ? `${duration} min` : "—"} · {session.status}
            </p>
          </div>
        </Card>

        {logs.length === 0 ? (
          <p className="text-center text-sm text-muted">Sin series registradas</p>
        ) : (
          <div className="space-y-4">
            {[...byExercise.entries()].map(([exId, exLogs]) => (
              <Card key={exId} className="p-4">
                <p className="font-medium">{exerciseNames.get(exId) ?? "Ejercicio"}</p>
                <div className="mt-3 space-y-2">
                  {exLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2 text-sm"
                    >
                      <span className="text-muted">Serie {log.set_number}</span>
                      {log.skipped ? (
                        <span className="text-muted">Omitida</span>
                      ) : log.duration_seconds ? (
                        <span>{log.duration_seconds}s</span>
                      ) : (
                        <span>
                          {log.reps ?? "—"} rep
                          {log.weight_kg != null ? ` · ${log.weight_kg} kg` : ""}
                          {log.rir != null ? ` · RIR ${log.rir}` : ""}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
