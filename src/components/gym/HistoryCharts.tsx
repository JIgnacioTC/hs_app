"use client";

import type { ExerciseHistory } from "@/lib/gym/sets";

export function MiniChart({
  points,
  field,
  label,
  unit,
}: {
  points: ExerciseHistory["points"];
  field: "max_weight" | "total_reps" | "avg_rir";
  label: string;
  unit: string;
}) {
  const values = points.map((p) => p[field] as number | null).filter((v): v is number => v != null);
  if (values.length < 2) {
    return (
      <div className="rounded-2xl bg-surface-muted p-4">
        <p className="grok-label mb-1">{label}</p>
        <p className="text-sm text-muted">Necesitas más sesiones</p>
      </div>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 280;
  const h = 64;
  const coords = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl bg-surface-muted p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="grok-label">{label}</p>
        <p className="font-mono text-sm text-accent">
          {values[values.length - 1]}
          {unit}
        </p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-accent-soft"
          points={coords}
        />
      </svg>
    </div>
  );
}

export function HistoryCharts({ history }: { history: ExerciseHistory }) {
  return (
    <div className="space-y-4">
      {history.personal_record && (
        <div className="rounded-2xl border border-accent-soft/30 bg-accent/5 p-4">
          <p className="grok-label text-accent-soft">Récord</p>
          <p className="font-mono text-2xl font-medium">
            {history.personal_record.weight_kg} kg
            {history.personal_record.reps ? ` × ${history.personal_record.reps}` : ""}
          </p>
          <p className="text-xs text-muted">{history.personal_record.date}</p>
        </div>
      )}
      <MiniChart points={history.points} field="max_weight" label="Peso máx." unit=" kg" />
      <MiniChart points={history.points} field="total_reps" label="Reps totales" unit="" />
      <MiniChart points={history.points} field="avg_rir" label="RIR promedio" unit="" />
    </div>
  );
}
