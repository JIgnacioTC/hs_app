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
      <header className="border-b border-border px-4 py-4 pt-safe">
        <button type="button" onClick={onClose} className="grok-label text-accent-soft">
          ← Cerrar
        </button>
        <h2 className="mt-2 text-xl font-semibold">{history.exercise_name}</h2>
        <p className="text-sm text-muted">
          {history.total_sessions} sesiones registradas
        </p>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <HistoryCharts history={history} />
      </div>
    </div>
  );
}
