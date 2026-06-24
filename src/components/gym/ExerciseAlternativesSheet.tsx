"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ExerciseMediaThumb } from "@/components/gym/ExerciseMedia";
import { api } from "@/lib/api-client";
import { EXERCISE_TYPE_LABELS } from "@/lib/gym/catalog-labels";
import type { ExerciseCatalog } from "@/lib/types";
import { cn } from "@/lib/utils";

type AlternativeExercise = ExerciseCatalog & { match_reason?: string };

interface AlternativesResponse {
  source: ExerciseCatalog;
  alternatives: AlternativeExercise[];
}

interface ExerciseAlternativesSheetProps {
  catalogId: string;
  exerciseName: string;
  excludeIds?: string[];
  onSelect: (catalog: ExerciseCatalog) => void | Promise<void>;
  onClose: () => void;
  /** When set, shows a secondary action to persist swap to the routine */
  onPersist?: (catalog: ExerciseCatalog) => void | Promise<void>;
}

export function ExerciseAlternativesSheet({
  catalogId,
  exerciseName,
  excludeIds = [],
  onSelect,
  onClose,
  onPersist,
}: ExerciseAlternativesSheetProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<AlternativeExercise[]>([]);
  const [source, setSource] = useState<ExerciseCatalog | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const exclude = [catalogId, ...excludeIds].filter(Boolean).join(",");
      const data = await api.get<AlternativesResponse>(
        `/api/gym/catalog/alternatives?catalog_id=${encodeURIComponent(catalogId)}&exclude=${encodeURIComponent(exclude)}&limit=10`
      );
      setSource(data.source);
      setAlternatives(data.alternatives);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar alternativas");
    } finally {
      setLoading(false);
    }
  }, [catalogId, excludeIds]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSelect(catalog: ExerciseCatalog, persist = false) {
    setSubmitting(catalog.id);
    setError(null);
    try {
      if (persist && onPersist) {
        await onPersist(catalog);
      } else {
        await onSelect(catalog);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo sustituir");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background">
      <header className="shrink-0 border-b border-border px-4 py-4 pt-safe">
        <button
          type="button"
          onClick={onClose}
          className="mb-3 flex items-center gap-2 text-sm text-accent-soft active:scale-[0.98]"
        >
          <ArrowLeft size={18} />
          Volver
        </button>
        <p className="grok-label flex items-center gap-1.5">
          <RefreshCw size={12} />
          Alternativas
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{exerciseName}</h2>
        <p className="mt-1 text-sm text-secondary">
          Si no puedes hacer este ejercicio, elige uno similar con el mismo enfoque muscular.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {error && (
          <p className="mb-4 rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[4.5rem] animate-pulse rounded-[20px] border border-border bg-surface"
              />
            ))}
          </div>
        ) : alternatives.length === 0 ? (
          <div className="rounded-[20px] border border-border bg-surface p-6 text-center">
            <p className="text-sm text-muted">No hay alternativas cercanas en el catálogo.</p>
            {source && (
              <p className="mt-2 text-xs text-secondary">
                Grupo: {source.muscle_group}
                {source.muscle_subgroup ? ` · ${source.muscle_subgroup}` : ""}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {alternatives.map((alt) => (
              <div
                key={alt.id}
                className="rounded-[20px] border border-border bg-surface p-3"
              >
                <div className="flex items-center gap-3">
                  <ExerciseMediaThumb exercise={alt} className="h-14 w-14 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{alt.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {alt.match_reason}
                      {alt.activity_count ? ` · ${alt.activity_count} sesiones` : ""}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-secondary">
                      {EXERCISE_TYPE_LABELS[alt.exercise_type] ?? alt.exercise_type}
                    </p>
                  </div>
                </div>
                <div className={cn("mt-3 flex gap-2", !onPersist && "grid grid-cols-1")}>
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={Boolean(submitting)}
                    onClick={() => void handleSelect(alt, false)}
                  >
                    {submitting === alt.id ? "Sustituyendo…" : onPersist ? "Solo esta sesión" : "Sustituir"}
                  </Button>
                  {onPersist && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={Boolean(submitting)}
                      onClick={() => void handleSelect(alt, true)}
                    >
                      Guardar en rutina
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
