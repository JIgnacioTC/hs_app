"use client";

import type { ExerciseHistory } from "@/lib/gym/sets";
import { ExerciseProgressChart } from "@/components/gym/ExerciseProgressChart";

export function HistoryCharts({ history }: { history: ExerciseHistory }) {
  if (history.points.length === 0) {
    return (
      <div className="rounded-[20px] border border-border bg-surface p-6 text-center">
        <p className="text-sm text-muted">
          Aún no hay datos suficientes. Completa series en una sesión para ver tu progreso.
        </p>
      </div>
    );
  }

  return <ExerciseProgressChart history={history} />;
}
