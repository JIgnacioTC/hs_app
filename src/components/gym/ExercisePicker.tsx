"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ExerciseMedia, ExerciseMediaThumb } from "@/components/gym/ExerciseMedia";
import { MuscleGroupFilter } from "@/components/gym/MuscleGroupFilter";
import { MuscleTags } from "@/components/gym/MuscleTags";
import { api } from "@/lib/api-client";
import type { ExerciseCatalog } from "@/lib/types";
import {
  EXERCISE_TYPE_LABELS,
  EXECUTION_MODE_LABELS,
  MUSCLE_GROUPS,
  REST_TYPE_LABELS,
  formatEquipment,
} from "@/lib/gym/catalog-labels";

interface ExercisePickerProps {
  onSelect: (exercise: ExerciseCatalog) => void;
  onClose: () => void;
  excludeIds?: string[];
}

export function ExercisePicker({ onSelect, onClose, excludeIds = [] }: ExercisePickerProps) {
  const [catalog, setCatalog] = useState<ExerciseCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<ExerciseCatalog | null>(null);

  const load = useCallback(async () => {
    const params = muscleGroup ? `?muscle_group=${encodeURIComponent(muscleGroup)}` : "";
    const data = await api.get<ExerciseCatalog[]>(`/api/gym/catalog${params}`);
    setCatalog(data);
    setLoading(false);
  }, [muscleGroup]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const excluded = new Set(excludeIds);
    return catalog.filter((e) => {
      if (excluded.has(e.id)) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.muscle_subgroup.toLowerCase().includes(q)
      );
    });
  }, [catalog, search, excludeIds]);

  function handleAdd() {
    if (!preview) return;
    onSelect(preview);
    onClose();
  }

  if (preview) {
    const description = preview.overview?.trim() || preview.instructions;

    return (
      <div className="fixed inset-0 z-[80] flex flex-col bg-background">
        <header className="shrink-0 border-b border-border px-4 py-4 pt-safe">
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="mb-3 flex items-center gap-2 text-sm text-accent-soft"
          >
            <ArrowLeft size={18} />
            Volver al catálogo
          </button>
          <p className="grok-label">{preview.muscle_group}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{preview.name}</h1>
          <p className="mt-0.5 text-sm text-muted">{preview.muscle_subgroup}</p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <ExerciseMedia exercise={preview} className="mb-6" />

          <Card className="mb-6 space-y-4 p-4">
            <p className="text-sm leading-relaxed text-secondary">{description}</p>

            <MuscleTags
              bodyParts={preview.body_parts}
              targetMuscles={preview.target_muscles}
              secondaryMuscles={preview.secondary_muscles}
            />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-surface-muted p-2">
                <span className="text-muted">Forma</span>
                <p className="mt-0.5 text-secondary">
                  {EXECUTION_MODE_LABELS[preview.execution_mode]} · {preview.default_prescription}
                </p>
              </div>
              <div className="rounded-xl bg-surface-muted p-2">
                <span className="text-muted">Descanso</span>
                <p className="mt-0.5 text-secondary">
                  {preview.rest_seconds}s · {REST_TYPE_LABELS[preview.rest_type]}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted">{formatEquipment(preview.equipment)}</p>
          </Card>
        </div>

        <footer className="shrink-0 border-t border-border bg-surface px-4 py-4 safe-bottom">
          <Button size="lg" className="w-full gap-2" onClick={handleAdd}>
            <Plus size={18} />
            Añadir a la cadena
          </Button>
        </footer>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-background">
      <header className="shrink-0 border-b border-border px-4 py-4 pt-safe">
        <div className="mb-3 flex items-center gap-3">
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="grok-label">Catálogo</p>
            <p className="text-sm text-secondary">Elige un movimiento</p>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            className="pl-10"
            placeholder="Buscar ejercicio…"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
        </div>

        <div className="mt-4">
          <MuscleGroupFilter groups={MUSCLE_GROUPS} active={muscleGroup} onSelect={setMuscleGroup} />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
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
          <p className="py-12 text-center text-sm text-muted">Sin resultados</p>
        ) : (
          <div className="space-y-2 pb-4">
            {filtered.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setPreview(ex)}
                className="flex w-full items-center gap-3 rounded-[20px] border border-border bg-surface p-4 text-left transition-colors hover:border-accent-soft/30 active:scale-[0.99]"
              >
                <ExerciseMediaThumb exercise={ex} className="h-14 w-14" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium tracking-tight">{ex.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {ex.muscle_subgroup} · {EXERCISE_TYPE_LABELS[ex.exercise_type] ?? ex.exercise_type}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-muted">
                    <span>{EXECUTION_MODE_LABELS[ex.execution_mode]}</span>
                    <span>·</span>
                    <span>{ex.default_prescription}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
