import type { ExerciseHistory, HistoryPoint } from "@/lib/gym/sets";

export type HistoryTimeRange = "1M" | "3M" | "6M" | "ALL";
export type HistoryMetric = "max_weight" | "total_reps" | "avg_rir";

export const HISTORY_TIME_RANGES: { id: HistoryTimeRange; label: string }[] = [
  { id: "1M", label: "1M" },
  { id: "3M", label: "3M" },
  { id: "6M", label: "6M" },
  { id: "ALL", label: "Todo" },
];

export const HISTORY_METRICS: { id: HistoryMetric; label: string; unit: string }[] = [
  { id: "max_weight", label: "Peso", unit: "kg" },
  { id: "total_reps", label: "Reps", unit: "" },
  { id: "avg_rir", label: "RIR", unit: "" },
];

export function filterPointsByRange(
  points: HistoryPoint[],
  range: HistoryTimeRange
): HistoryPoint[] {
  if (range === "ALL" || points.length === 0) return points;

  const months = range === "1M" ? 1 : range === "3M" ? 3 : 6;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setMonth(cutoff.getMonth() - months);

  return points.filter((point) => new Date(`${point.date}T12:00:00`) >= cutoff);
}

export function metricValue(point: HistoryPoint, metric: HistoryMetric): number | null {
  return point[metric];
}

export function chartSeries(
  points: HistoryPoint[],
  metric: HistoryMetric
): { date: string; value: number }[] {
  return points
    .map((point) => {
      const value = metricValue(point, metric);
      return value == null ? null : { date: point.date, value };
    })
    .filter((row): row is { date: string; value: number } => row != null);
}

export function formatChartDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

export function formatMetricValue(value: number, metric: HistoryMetric): string {
  if (metric === "max_weight") {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
  }
  if (metric === "avg_rir") {
    return value.toFixed(1);
  }
  return `${Math.round(value)}`;
}

export function metricUnit(metric: HistoryMetric): string {
  return HISTORY_METRICS.find((m) => m.id === metric)?.unit ?? "";
}

export interface HistoryChartStats {
  current: number | null;
  peak: number | null;
  change: number | null;
  changePct: number | null;
  days: number;
  sessions: number;
}

export function computeChartStats(
  points: HistoryPoint[],
  metric: HistoryMetric,
  history: ExerciseHistory
): HistoryChartStats {
  const series = chartSeries(points, metric);
  const values = series.map((row) => row.value);

  if (!values.length) {
    return {
      current: null,
      peak: null,
      change: null,
      changePct: null,
      days: points.length,
      sessions: history.total_sessions,
    };
  }

  const current = values[values.length - 1];
  const first = values[0];
  const peak = Math.max(...values);
  const change = values.length > 1 ? current - first : null;
  const changePct =
    change != null && first !== 0 ? Math.round((change / first) * 1000) / 10 : null;

  return {
    current,
    peak,
    change,
    changePct,
    days: points.length,
    sessions: new Set(points.map((p) => p.date)).size,
  };
}
