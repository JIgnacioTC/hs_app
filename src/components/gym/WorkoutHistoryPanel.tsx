"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Calendar, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ExerciseDetail } from "@/components/gym/ExerciseDetail";
import { SessionDetailSheet } from "@/components/gym/SessionDetailSheet";
import { api } from "@/lib/api-client";
import type { SetLog } from "@/lib/gym/sets";
import type { ExerciseCatalog, GymSession } from "@/lib/types";

interface ExerciseActivityStat {
  catalog_id: string;
  name: string;
  muscle_group: string;
  muscle_subgroup: string;
  set_count: number;
  session_count: number;
  last_done: string | null;
}

interface HistorySummary {
  recent_sessions: GymSession[];
  exercise_stats: ExerciseActivityStat[];
}

type SessionDetail = GymSession & {
  gym_routines?: { name?: string; gym_exercises?: Array<{ id: string; name: string }> };
  set_logs?: SetLog[];
};

export function WorkoutHistoryPanel() {
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseCatalog | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.get<HistorySummary>("/api/gym/history");
    setSummary(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function openSession(sessionId: string) {
    const detail = await api.get<SessionDetail>(`/api/gym/sessions/${sessionId}`);
    setSelectedSession(detail);
  }

  if (selectedSession) {
    return (
      <SessionDetailSheet session={selectedSession} onClose={() => setSelectedSession(null)} />
    );
  }

  if (selectedExercise) {
    return (
      <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-[20px] bg-surface-muted" />
        ))}
      </div>
    );
  }

  const sessions = summary?.recent_sessions ?? [];
  const stats = summary?.exercise_stats ?? [];
  const completedSessions = sessions.filter((s) => s.status === "completed");

  if (!completedSessions.length && !stats.length) {
    return (
      <Card className="p-10 text-center">
        <Activity size={32} className="mx-auto mb-4 text-accent-soft" />
        <p className="text-lg font-medium tracking-tight">Sin historial aún</p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
          Completa una sesión de flujo para empezar a registrar tu progreso.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8 pb-4">
      {completedSessions.length > 0 && (
        <section>
          <p className="grok-label mb-3">Sesiones recientes</p>
          <div className="space-y-2">
            {completedSessions.slice(0, 8).map((session) => {
              const date = new Date(session.started_at);
              const duration =
                session.completed_at && session.started_at
                  ? Math.round(
                      (new Date(session.completed_at).getTime() -
                        new Date(session.started_at).getTime()) /
                        60000
                    )
                  : null;

              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => void openSession(session.id)}
                  className="w-full text-left"
                >
                  <Card className="flex items-center gap-3 p-4 transition-colors hover:border-accent-soft/30">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                      <Calendar size={18} className="text-accent-soft" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {session.gym_routines?.name ?? "Sesión"}
                      </p>
                      <p className="text-xs text-muted">
                        {date.toLocaleDateString("es-ES", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                        {duration != null ? ` · ${duration} min` : ""}
                      </p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-muted" />
                  </Card>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {stats.length > 0 && (
        <section>
          <p className="grok-label mb-3">Progreso por ejercicio</p>
          <div className="space-y-2">
            {stats.map((stat) => (
              <button
                key={stat.catalog_id}
                type="button"
                onClick={async () => {
                  const full = await api.get<ExerciseCatalog>(
                    `/api/gym/catalog?id=${stat.catalog_id}`
                  );
                  setSelectedExercise(full);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-[20px] border border-border bg-surface p-4 text-left transition-colors hover:border-accent-soft/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium tracking-tight">{stat.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {stat.muscle_subgroup} · {stat.set_count} series · {stat.session_count}{" "}
                    sesiones
                  </p>
                  {stat.last_done && (
                    <p className="mt-1 text-[10px] text-muted">Último: {stat.last_done}</p>
                  )}
                </div>
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
