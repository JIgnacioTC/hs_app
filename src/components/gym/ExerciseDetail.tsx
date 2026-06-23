"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Film } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { HistoryCharts } from "@/components/gym/HistoryCharts";
import { api } from "@/lib/api-client";
import {
  EXERCISE_TYPE_LABELS,
  EXECUTION_MODE_LABELS,
  REST_TYPE_LABELS,
  formatEquipment,
} from "@/lib/gym/catalog-labels";
import type { ExerciseHistory } from "@/lib/gym/sets";
import type { ExerciseCatalog } from "@/lib/types";

interface ExerciseDetailProps {
  exercise: ExerciseCatalog;
  onClose: () => void;
}

export function ExerciseDetail({ exercise, onClose }: ExerciseDetailProps) {
  const [history, setHistory] = useState<ExerciseHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    setLoadingHistory(true);
    api
      .get<ExerciseHistory>(`/api/gym/history/${exercise.id}`)
      .then(setHistory)
      .finally(() => setLoadingHistory(false));
  }, [exercise.id]);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background">
      <header className="border-b border-border px-4 py-4 pt-safe">
        <button
          type="button"
          onClick={onClose}
          className="mb-3 flex items-center gap-2 text-sm text-accent-soft"
        >
          <ArrowLeft size={18} />
          Volver
        </button>
        <p className="grok-label">{exercise.muscle_group}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{exercise.name}</h1>
        <p className="mt-0.5 text-sm text-muted">{exercise.muscle_subgroup}</p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        <div className="mb-6 overflow-hidden rounded-[20px] border border-border bg-surface-muted">
          {exercise.demo_gif_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={exercise.demo_gif_url}
              alt={`Demo de ${exercise.name}`}
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-2 px-6 text-center">
              <Film size={32} className="text-muted" />
              <p className="text-sm font-medium text-secondary">Demo del movimiento</p>
              <p className="text-xs text-muted">Aquí cargaremos el GIF de técnica</p>
            </div>
          )}
        </div>

        <Card className="mb-6 space-y-3 p-4">
          <p className="text-sm leading-relaxed text-secondary">{exercise.instructions}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-surface-muted p-2">
              <span className="text-muted">Forma</span>
              <p className="mt-0.5 text-secondary">
                {EXECUTION_MODE_LABELS[exercise.execution_mode] ?? exercise.execution_mode} ·{" "}
                {exercise.default_prescription}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-2">
              <span className="text-muted">Descanso</span>
              <p className="mt-0.5 text-secondary">
                {exercise.rest_seconds}s · {REST_TYPE_LABELS[exercise.rest_type]}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-2">
              <span className="text-muted">Tipo</span>
              <p className="mt-0.5 text-secondary">
                {EXERCISE_TYPE_LABELS[exercise.exercise_type] ?? exercise.exercise_type}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-2">
              <span className="text-muted">Equipo</span>
              <p className="mt-0.5 text-secondary">{formatEquipment(exercise.equipment)}</p>
            </div>
          </div>
        </Card>

        <div>
          <p className="grok-label mb-4">Tu historial</p>
          {loadingHistory ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-muted" />
              ))}
            </div>
          ) : history && history.points.length > 0 ? (
            <>
              <p className="mb-4 text-sm text-muted">
                {history.total_sessions} sesiones · {history.points.length} días registrados
              </p>
              <HistoryCharts history={history} />
            </>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted">
                Aún no hay datos de este ejercicio. Completa series en una sesión para ver tu progreso.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
