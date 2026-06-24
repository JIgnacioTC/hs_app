"use client";

import { useMemo } from "react";
import { SlidersHorizontal, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EXERCISE_TYPE_LABELS, MUSCLE_GROUPS } from "@/lib/gym/catalog-labels";
import { cn } from "@/lib/utils";

export type ExerciseSortMode = "name" | "activity";

export interface ExerciseFilterState {
  muscleGroup: string | null;
  subgroup: string | null;
  exerciseType: string | null;
  sort: ExerciseSortMode;
}

interface ExerciseFilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: ExerciseFilterState;
  onChange: (filters: ExerciseFilterState) => void;
  subgroups: string[];
  exerciseTypes: string[];
}

export function countActiveFilters(filters: ExerciseFilterState): number {
  let n = 0;
  if (filters.muscleGroup) n++;
  if (filters.subgroup) n++;
  if (filters.exerciseType) n++;
  if (filters.sort === "activity") n++;
  return n;
}

export function ExerciseFilterButton({
  activeCount,
  onClick,
}: {
  activeCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition-colors",
        activeCount > 0
          ? "border-accent-soft bg-accent/10 text-accent"
          : "border-border bg-surface text-secondary"
      )}
    >
      <SlidersHorizontal size={16} />
      Filtros
      {activeCount > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 font-mono text-[10px] text-background">
          {activeCount}
        </span>
      )}
    </button>
  );
}

export function ExerciseFilterSheet({
  open,
  onClose,
  filters,
  onChange,
  subgroups,
  exerciseTypes,
}: ExerciseFilterSheetProps) {
  const summary = useMemo(() => {
    const parts: string[] = [];
    if (filters.muscleGroup) parts.push(filters.muscleGroup);
    if (filters.subgroup) parts.push(filters.subgroup);
    if (filters.exerciseType) {
      parts.push(EXERCISE_TYPE_LABELS[filters.exerciseType] ?? filters.exerciseType);
    }
    if (filters.sort === "activity") parts.push("Más actividad");
    return parts.length ? parts.join(" · ") : "Sin filtros activos";
  }, [filters]);

  if (!open) return null;

  function patch(partial: Partial<ExerciseFilterState>) {
    onChange({ ...filters, ...partial });
  }

  function reset() {
    onChange({
      muscleGroup: null,
      subgroup: null,
      exerciseType: null,
      sort: "name",
    });
  }

  return (
    <div className="fixed inset-0 z-[88] flex items-end bg-black/60" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-surface p-4 pb-8 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="grok-label">Filtros</p>
            <p className="mt-0.5 text-xs text-muted">{summary}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted">
            <X size={20} />
          </button>
        </div>

        <section className="mb-5">
          <p className="grok-label mb-2">Orden</p>
          <div className="flex gap-2">
            <FilterOption
              active={filters.sort === "name"}
              onClick={() => patch({ sort: "name" })}
              label="A → Z"
            />
            <FilterOption
              active={filters.sort === "activity"}
              onClick={() => patch({ sort: "activity" })}
              label="Más actividad"
              icon={<TrendingUp size={12} />}
            />
          </div>
        </section>

        <section className="mb-5">
          <p className="grok-label mb-2">Grupo muscular</p>
          <div className="flex flex-wrap gap-2">
            <FilterOption
              active={!filters.muscleGroup}
              onClick={() => patch({ muscleGroup: null, subgroup: null })}
              label="Todos"
            />
            {MUSCLE_GROUPS.map((g) => (
              <FilterOption
                key={g}
                active={filters.muscleGroup === g}
                onClick={() =>
                  patch({
                    muscleGroup: filters.muscleGroup === g ? null : g,
                    subgroup: null,
                  })
                }
                label={g}
              />
            ))}
          </div>
        </section>

        {subgroups.length > 1 && (
          <section className="mb-5">
            <p className="grok-label mb-2">Subgrupo</p>
            <div className="flex flex-wrap gap-2">
              <FilterOption
                active={!filters.subgroup}
                onClick={() => patch({ subgroup: null })}
                label="Todos"
              />
              {subgroups.map((sg) => (
                <FilterOption
                  key={sg}
                  active={filters.subgroup === sg}
                  onClick={() => patch({ subgroup: filters.subgroup === sg ? null : sg })}
                  label={sg}
                />
              ))}
            </div>
          </section>
        )}

        {exerciseTypes.length > 1 && (
          <section className="mb-6">
            <p className="grok-label mb-2">Tipo</p>
            <div className="flex flex-wrap gap-2">
              <FilterOption
                active={!filters.exerciseType}
                onClick={() => patch({ exerciseType: null })}
                label="Todos"
              />
              {exerciseTypes.map((t) => (
                <FilterOption
                  key={t}
                  active={filters.exerciseType === t}
                  onClick={() => patch({ exerciseType: filters.exerciseType === t ? null : t })}
                  label={EXERCISE_TYPE_LABELS[t] ?? t}
                />
              ))}
            </div>
          </section>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={reset}>
            Limpiar
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilterOption({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors",
        active ? "border-accent-soft bg-accent/10 text-accent" : "border-border text-muted"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
