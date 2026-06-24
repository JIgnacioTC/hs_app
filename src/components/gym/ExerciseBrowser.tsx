"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { ExerciseDetail } from "@/components/gym/ExerciseDetail";
import { ExerciseMediaThumb } from "@/components/gym/ExerciseMedia";
import {
  countActiveFilters,
  ExerciseFilterButton,
  ExerciseFilterSheet,
  type ExerciseFilterState,
} from "@/components/gym/ExerciseFilterSheet";
import { ExerciseListSkeleton } from "@/components/ui/Skeleton";
import { useStaleQuery } from "@/hooks/useStaleQuery";
import { prefetchImageUrls } from "@/lib/app-prefetch";
import { EXERCISE_TYPE_LABELS } from "@/lib/gym/catalog-labels";
import type { ExerciseCatalog } from "@/lib/types";

const DEFAULT_FILTERS: ExerciseFilterState = {
  muscleGroup: null,
  subgroup: null,
  exerciseType: null,
  sort: "name",
};

export function ExerciseBrowser() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ExerciseFilterState>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<ExerciseCatalog | null>(null);

  const catalogPath = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.muscleGroup) params.set("muscle_group", filters.muscleGroup);
    if (filters.subgroup) params.set("subgroup", filters.subgroup);
    if (filters.exerciseType) params.set("exercise_type", filters.exerciseType);
    params.set("sort", filters.sort);
    const qs = params.toString();
    return `/api/gym/catalog${qs ? `?${qs}` : ""}`;
  }, [filters]);

  const { data: catalogData, loading } = useStaleQuery<ExerciseCatalog[]>(catalogPath);
  const catalog = catalogData ?? [];

  useEffect(() => {
    if (!catalog.length) return;
    const urls = catalog
      .slice(0, 24)
      .map(
        (exercise) =>
          exercise.image_url ??
          exercise.image_urls?.["360p"] ??
          exercise.demo_gif_url ??
          null
      )
      .filter((url): url is string => Boolean(url));
    prefetchImageUrls(urls, 24);
  }, [catalog]);

  const subgroups = useMemo(() => {
    const source = filters.muscleGroup
      ? catalog.filter((e) => e.muscle_group === filters.muscleGroup)
      : catalog;
    return [...new Set(source.map((e) => e.muscle_subgroup))].sort((a, b) =>
      a.localeCompare(b, "es")
    );
  }, [catalog, filters.muscleGroup]);

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
        e.instructions?.toLowerCase().includes(q) ||
        e.slug.includes(q)
    );
  }, [catalog, search]);

  const activeFilterCount = countActiveFilters(filters);

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

      <div className="mb-4">
        <ExerciseFilterButton
          activeCount={activeFilterCount}
          onClick={() => setFilterOpen(true)}
        />
      </div>

      <ExerciseFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
        subgroups={subgroups}
        exerciseTypes={exerciseTypes}
      />

      <p className="grok-label mb-3">
        {loading ? "Cargando…" : `${filtered.length} ejercicios`}
      </p>

      {loading && catalog.length === 0 ? (
        <ExerciseListSkeleton />
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">Sin resultados con estos filtros</p>
      ) : (
        <div className="space-y-2 pb-4">
          {filtered.map((ex, i) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setSelected(ex)}
              className="flex w-full items-center gap-3 rounded-[20px] border border-border bg-surface p-4 text-left transition-colors hover:border-accent-soft/30 active:scale-[0.99]"
            >
                <ExerciseMediaThumb exercise={ex} className="h-16 w-16" priority={i < 8} />
              <div className="min-w-0 flex-1">
                <p className="font-medium tracking-tight">{ex.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {ex.muscle_subgroup} · {EXERCISE_TYPE_LABELS[ex.exercise_type] ?? ex.exercise_type}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {(ex.activity_count ?? 0) > 0 && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
                    {ex.activity_count}
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
