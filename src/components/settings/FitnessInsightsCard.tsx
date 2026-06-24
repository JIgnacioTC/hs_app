"use client";

import type { FitnessInsights } from "@/lib/fitness/profile";
import { cn } from "@/lib/utils";

export function FitnessInsightsCard({
  insights,
  className,
}: {
  insights: FitnessInsights;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[20px] border border-border bg-surface p-4", className)}>
      <p className="grok-label">Tu condición</p>
      <p className="mt-1 text-sm font-medium">{insights.conditioning_label}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Metric label="Edad" value={insights.age != null ? `${insights.age} años` : "—"} />
        <Metric
          label="IMC"
          value={insights.bmi != null ? `${insights.bmi}` : "—"}
          hint={insights.bmi_label ?? undefined}
        />
        <Metric
          label="Metabolismo basal"
          value={insights.bmr_kcal != null ? `${insights.bmr_kcal} kcal` : "—"}
        />
        <Metric
          label="Gasto estimado"
          value={insights.tdee_kcal != null ? `${insights.tdee_kcal} kcal` : "—"}
          hint="con tu actividad"
        />
      </div>

      {insights.training_hints.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-border pt-4 text-xs leading-relaxed text-secondary">
          {insights.training_hints.map((hint) => (
            <li key={hint}>· {hint}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted px-3 py-2">
      <p className="grok-label text-[9px]">{label}</p>
      <p className="mt-0.5 font-mono text-sm">{value}</p>
      {hint && <p className="mt-0.5 text-[10px] text-muted">{hint}</p>}
    </div>
  );
}
