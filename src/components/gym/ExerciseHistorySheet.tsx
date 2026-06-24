"use client";

import type { ExerciseHistory } from "@/lib/gym/sets";
import { HistoryCharts } from "@/components/gym/HistoryCharts";

export function ExerciseHistorySheet({
  history,
  onClose,
}: {
  history: ExerciseHistory;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-background">
      <div className="shrink-0 px-4 pt-safe">
        <button
          type="button"
          onClick={onClose}
          className="py-4 grok-label text-accent-soft active:scale-[0.98]"
        >
          ← Cerrar
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
        <HistoryCharts history={history} />

        <div className="mt-6 border-t border-border pt-4">
          <h2 className="text-lg font-semibold">{history.exercise_name}</h2>
          <p className="mt-1 text-sm text-muted">
            {history.total_sessions} sesiones registradas
          </p>
        </div>
      </div>
    </div>
  );
}
