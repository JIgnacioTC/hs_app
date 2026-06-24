"use client";

import { useMemo, useState } from "react";
import type { ExerciseHistory } from "@/lib/gym/sets";
import {
  HISTORY_METRICS,
  HISTORY_TIME_RANGES,
  chartSeries,
  computeChartStats,
  filterPointsByRange,
  formatChartDate,
  formatMetricValue,
  metricUnit,
  type HistoryMetric,
  type HistoryTimeRange,
} from "@/lib/gym/history-chart";
import { cn } from "@/lib/utils";

function ProgressLineChart({
  series,
  metric,
}: {
  series: { date: string; value: number }[];
  metric: HistoryMetric;
}) {
  const width = 320;
  const height = 196;
  const padding = { top: 14, right: 14, bottom: 30, left: 38 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const { coords, linePath, areaPath, gridLines, yTicks } = useMemo(() => {
    if (series.length === 0) {
      return { coords: [], linePath: "", areaPath: "", gridLines: [], yTicks: [] };
    }

    const values = series.map((row) => row.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min || Math.max(max * 0.1, 1);
    const paddedMin = min - spread * 0.08;
    const paddedMax = max + spread * 0.08;
    const valueRange = paddedMax - paddedMin || 1;

    const mapped = series.map((row, index) => {
      const x =
        padding.left +
        (series.length === 1 ? innerW / 2 : (index / (series.length - 1)) * innerW);
      const y =
        padding.top + innerH - ((row.value - paddedMin) / valueRange) * innerH;
      return { ...row, x, y };
    });

    const path = mapped
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

    const baseY = padding.top + innerH;
    const area = `${path} L ${mapped[mapped.length - 1].x} ${baseY} L ${mapped[0].x} ${baseY} Z`;

    const ticks = [0, 0.5, 1].map((t) => {
      const value = paddedMin + valueRange * t;
      const y = padding.top + innerH - t * innerH;
      return { y, value };
    });

    const grids = [0.25, 0.5, 0.75].map((t) => padding.top + innerH * (1 - t));

    return {
      coords: mapped,
      linePath: path,
      areaPath: area,
      gridLines: grids,
      yTicks: ticks,
    };
  }, [series, innerH, innerW, padding.left, padding.top]);

  if (series.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-[16px] bg-chart-surface text-sm text-muted">
        Sin datos en este rango
      </div>
    );
  }

  if (series.length === 1) {
    return (
      <div className="relative overflow-hidden rounded-[16px] bg-chart-surface">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <rect
            x={padding.left}
            y={padding.top}
            width={innerW}
            height={innerH}
            rx={12}
            className="fill-chart-surface"
          />
          <line
            x1={padding.left}
            y1={padding.top + innerH * 0.5}
            x2={padding.left + innerW}
            y2={padding.top + innerH * 0.5}
            className="stroke-chart-grid"
            strokeWidth={1}
          />
          <circle
            cx={padding.left + innerW / 2}
            cy={padding.top + innerH * 0.5}
            r={3}
            className="fill-chart-line opacity-60"
          />
          <text
            x={padding.left + innerW / 2}
            y={height - 8}
            textAnchor="middle"
            className="fill-muted text-[9px]"
          >
            {formatChartDate(series[0].date)}
          </text>
          <text
            x={padding.left - 8}
            y={padding.top + innerH * 0.5 + 4}
            textAnchor="end"
            className="fill-muted text-[9px] font-mono"
          >
            {formatMetricValue(series[0].value, metric)}
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[16px] bg-chart-surface">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Gráfica de progreso del ejercicio"
      >
        <defs>
          <linearGradient id="progress-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect
          x={padding.left}
          y={padding.top}
          width={innerW}
          height={innerH}
          rx={12}
          className="fill-chart-surface"
        />

        {gridLines.map((y) => (
          <line
            key={y}
            x1={padding.left}
            y1={y}
            x2={padding.left + innerW}
            y2={y}
            className="stroke-chart-grid"
            strokeWidth={1}
          />
        ))}

        {yTicks.map((tick) => (
          <text
            key={tick.y}
            x={padding.left - 8}
            y={tick.y + 3}
            textAnchor="end"
            className="fill-muted text-[9px] font-mono"
          >
            {formatMetricValue(tick.value, metric)}
          </text>
        ))}

        <path d={areaPath} fill="url(#progress-chart-fill)" />
        <path
          d={linePath}
          fill="none"
          className="stroke-chart-line"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coords.length > 0 && (
          <>
            <text
              x={coords[0].x}
              y={height - 8}
              textAnchor="start"
              className="fill-muted text-[9px]"
            >
              {formatChartDate(coords[0].date)}
            </text>
            <text
              x={coords[coords.length - 1].x}
              y={height - 8}
              textAnchor="end"
              className="fill-muted text-[9px]"
            >
              {formatChartDate(coords[coords.length - 1].date)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-border bg-surface p-3">
      <p className="grok-label">{label}</p>
      <p className={cn("mt-1 font-mono text-xl font-medium", accent && "text-chart-line")}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[10px] text-muted">{hint}</p>}
    </div>
  );
}

export function ExerciseProgressChart({ history }: { history: ExerciseHistory }) {
  const [range, setRange] = useState<HistoryTimeRange>("3M");
  const [metric, setMetric] = useState<HistoryMetric>("max_weight");

  const filteredPoints = useMemo(
    () => filterPointsByRange(history.points, range),
    [history.points, range]
  );
  const series = useMemo(
    () => chartSeries(filteredPoints, metric),
    [filteredPoints, metric]
  );
  const stats = useMemo(
    () => computeChartStats(filteredPoints, metric, history),
    [filteredPoints, metric, history]
  );

  const unit = metricUnit(metric);
  const unitSuffix = unit ? ` ${unit}` : "";

  const changeLabel =
    stats.change == null
      ? "—"
      : `${stats.change > 0 ? "+" : ""}${formatMetricValue(stats.change, metric)}${unitSuffix}${
          stats.changePct != null ? ` (${stats.changePct > 0 ? "+" : ""}${stats.changePct}%)` : ""
        }`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          label="Actual"
          value={
            stats.current != null
              ? `${formatMetricValue(stats.current, metric)}${unitSuffix}`
              : "—"
          }
          accent
        />
        <MetricCard
          label="Pico"
          value={
            stats.peak != null ? `${formatMetricValue(stats.peak, metric)}${unitSuffix}` : "—"
          }
        />
        <MetricCard label="Cambio" value={changeLabel} hint="vs. inicio del rango" />
        <MetricCard
          label="Días"
          value={`${stats.days}`}
          hint={`${stats.sessions} con registro`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-full border border-border bg-surface p-1">
          {HISTORY_METRICS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMetric(item.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs transition-all duration-200 active:scale-[0.98]",
                metric === item.id
                  ? "bg-accent text-background"
                  : "text-muted hover:text-secondary"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-full border border-border bg-surface p-1">
          {HISTORY_TIME_RANGES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              className={cn(
                "rounded-full px-2.5 py-1.5 text-[11px] transition-all duration-200 active:scale-[0.98]",
                range === item.id
                  ? "bg-surface-muted text-foreground"
                  : "text-muted hover:text-secondary"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-border bg-surface p-3">
        <ProgressLineChart series={series} metric={metric} />
      </div>

      {history.personal_record && metric === "max_weight" && (
        <div className="rounded-[20px] border border-border bg-surface p-4">
          <p className="grok-label">Récord personal</p>
          <p className="mt-1 font-mono text-lg font-medium">
            {history.personal_record.weight_kg != null
              ? `${history.personal_record.weight_kg} kg`
              : "—"}
            {history.personal_record.reps ? ` × ${history.personal_record.reps}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {formatChartDate(history.personal_record.date)}
          </p>
        </div>
      )}
    </div>
  );
}
