"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { HistoryCharts } from "@/components/gym/HistoryCharts";
import { ExerciseMedia } from "@/components/gym/ExerciseMedia";
import { MuscleTags } from "@/components/gym/MuscleTags";
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

  const description = exercise.overview?.trim() || exercise.instructions;

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
        <ExerciseMedia exercise={exercise} className="mb-6" />

        <Card className="mb-6 space-y-4 p-4">
          <p className="text-sm leading-relaxed text-secondary">{description}</p>

          <MuscleTags
            bodyParts={exercise.body_parts}
            targetMuscles={exercise.target_muscles}
            secondaryMuscles={exercise.secondary_muscles}
          />

          {exercise.exercise_tips && exercise.exercise_tips.length > 0 && (
            <div>
              <p className="grok-label mb-2">Consejos de técnica</p>
              <ul className="space-y-2 text-sm text-secondary">
                {exercise.exercise_tips.slice(0, 4).map((tip) => (
                  <li key={tip.slice(0, 40)} className="leading-relaxed">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

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
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-[20px] bg-surface-muted" />
                ))}
              </div>
              <div className="h-52 animate-pulse rounded-[20px] bg-surface-muted" />
            </div>
          ) : history ? (
            <HistoryCharts history={history} />
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
