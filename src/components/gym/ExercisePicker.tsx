"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api-client";
import type { ExerciseCatalog } from "@/lib/types";
import {
  EXERCISE_TYPE_LABELS,
  EXECUTION_MODE_LABELS,
  MUSCLE_GROUPS,
  REST_TYPE_LABELS,
  formatEquipment,
} from "@/lib/gym/catalog-labels";
import { cn } from "@/lib/utils";

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

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-background">
      <header className="border-b border-border px-4 py-4 pt-safe">
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
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setMuscleGroup(null)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors",
              !muscleGroup ? "border-accent-soft bg-accent/10 text-accent" : "border-border text-muted"
            )}
          >
            Todos
          </button>
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setMuscleGroup(g)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors",
                muscleGroup === g
                  ? "border-accent-soft bg-accent/10 text-accent"
                  : "border-border text-muted"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-[20px] bg-surface-muted" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">Sin resultados</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setPreview(ex)}
                  className={cn(
                    "w-full rounded-[20px] border p-4 text-left transition-colors",
                    preview?.id === ex.id
                      ? "border-accent-soft bg-accent/5"
                      : "border-border bg-surface hover:border-accent-soft/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium tracking-tight">{ex.name}</p>
                      <p className="mt-0.5 text-xs text-muted">{ex.muscle_subgroup}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-secondary">
                      {EXERCISE_TYPE_LABELS[ex.exercise_type] ?? ex.exercise_type}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted">
                    <span>{EXECUTION_MODE_LABELS[ex.execution_mode]}</span>
                    <span>·</span>
                    <span>{ex.default_prescription}</span>
                    <span>·</span>
                    <span>{REST_TYPE_LABELS[ex.rest_type]}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {preview && (
          <div className="border-t border-border bg-surface p-4 pb-8 safe-bottom">
            <Card className="mb-4 space-y-3 p-4">
              <div>
                <p className="grok-label">{preview.muscle_group}</p>
                <h3 className="text-lg font-semibold">{preview.name}</h3>
              </div>
              <p className="text-sm leading-relaxed text-secondary">{preview.instructions}</p>
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
            <Button
              size="lg"
              className="gap-2"
              onClick={() => {
                onSelect(preview);
                onClose();
              }}
            >
              <Plus size={18} />
              Añadir a la cadena
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
