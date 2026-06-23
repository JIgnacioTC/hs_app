"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Search, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { ExerciseDetail } from "@/components/gym/ExerciseDetail";
import { ExerciseMediaThumb } from "@/components/gym/ExerciseMedia";
import { MuscleGroupFilter } from "@/components/gym/MuscleGroupFilter";
import { api } from "@/lib/api-client";
import {
  EXERCISE_TYPE_LABELS,
  MUSCLE_GROUPS,
} from "@/lib/gym/catalog-labels";
import type { ExerciseCatalog } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortMode = "name" | "activity";

export function ExerciseBrowser() {
  const [catalog, setCatalog] = useState<ExerciseCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null);
  const [subgroup, setSubgroup] = useState<string | null>(null);
  const [exerciseType, setExerciseType] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("name");
  const [selected, setSelected] = useState<ExerciseCatalog | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (muscleGroup) params.set("muscle_group", muscleGroup);
    if (subgroup) params.set("subgroup", subgroup);
    if (exerciseType) params.set("exercise_type", exerciseType);
    params.set("sort", sort);
    const qs = params.toString();
    const data = await api.get<ExerciseCatalog[]>(`/api/gym/catalog${qs ? `?${qs}` : ""}`);
    setCatalog(data);
    setLoading(false);
  }, [muscleGroup, subgroup, exerciseType, sort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSubgroup(null);
  }, [muscleGroup]);

  const subgroups = useMemo(() => {
    const source = muscleGroup
      ? catalog.filter((e) => e.muscle_group === muscleGroup)
      : catalog;
    return [...new Set(source.map((e) => e.muscle_subgroup))].sort((a, b) =>
      a.localeCompare(b, "es")
    );
  }, [catalog, muscleGroup]);

  const exerciseTypes = useMemo(
    () => [...new Set(catalog.map((e) => e.exercise_type))].sort(),
    [catalog]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscle_subgroup.toLowerCase().includes(q) ||
        e.slug.includes(q)
    );
  }, [catalog, search]);

  if (selected) {
    return <ExerciseDetail exercise={selected} onClose={() => setSelected(null)} />;
  }

  return (
    <div>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <Input
          className="pl-10"
          placeholder="Buscar ejercicio…"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </div>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setSort("name")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs transition-colors",
            sort === "name"
              ? "border-accent-soft bg-accent/10 text-accent"
              : "border-border text-muted"
          )}
        >
          A → Z
        </button>
        <button
          type="button"
          onClick={() => setSort("activity")}
          className={cn(
            "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors",
            sort === "activity"
              ? "border-accent-soft bg-accent/10 text-accent"
              : "border-border text-muted"
          )}
        >
          <TrendingUp size={12} />
          Más actividad
        </button>
      </div>

      <MuscleGroupFilter
        groups={MUSCLE_GROUPS}
        active={muscleGroup}
        onSelect={setMuscleGroup}
      />

      {subgroups.length > 1 && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <FilterChip active={!subgroup} onClick={() => setSubgroup(null)} label="Subgrupo" />
          {subgroups.map((sg) => (
            <FilterChip
              key={sg}
              active={subgroup === sg}
              onClick={() => setSubgroup(sg)}
              label={sg}
            />
          ))}
        </div>
      )}

      {exerciseTypes.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <FilterChip active={!exerciseType} onClick={() => setExerciseType(null)} label="Tipo" />
          {exerciseTypes.map((t) => (
            <FilterChip
              key={t}
              active={exerciseType === t}
              onClick={() => setExerciseType(t)}
              label={EXERCISE_TYPE_LABELS[t] ?? t}
            />
          ))}
        </div>
      )}

      <p className="grok-label mb-3">
        {loading ? "Cargando…" : `${filtered.length} ejercicios`}
      </p>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[20px] bg-surface-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">Sin resultados con estos filtros</p>
      ) : (
        <div className="space-y-2 pb-4">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setSelected(ex)}
              className="flex w-full items-center justify-between gap-3 rounded-[20px] border border-border bg-surface p-4 text-left transition-colors hover:border-accent-soft/30 active:scale-[0.99]"
            >
              <ExerciseMediaThumb exercise={ex} className="h-14 w-14" />
              <div className="min-w-0 flex-1">
                <p className="font-medium tracking-tight">{ex.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {ex.muscle_subgroup} · {EXERCISE_TYPE_LABELS[ex.exercise_type] ?? ex.exercise_type}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {(ex.activity_count ?? 0) > 0 && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
                    {ex.activity_count} series
                  </span>
                )}
                <ChevronRight size={16} className="text-muted" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors",
        active ? "border-accent-soft bg-accent/10 text-accent" : "border-border text-muted"
      )}
    >
      {label}
    </button>
  );
}
