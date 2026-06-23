"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ExercisePicker } from "@/components/gym/ExercisePicker";
import { SetPlanEditor } from "@/components/gym/SetPlanEditor";
import { FlowChainVertical } from "@/components/gym/FlowThread";
import { stepsOf } from "@/lib/gym/flow";
import type { Flow } from "@/lib/gym/flow";
import { defaultPlannedSets, type PlannedSet } from "@/lib/gym/sets";
import type { ExerciseCatalog } from "@/lib/types";

interface FlowEditorProps {
  flow: Flow;
  onAddStep: (catalogId: string, planned_sets: PlannedSet[]) => Promise<void>;
  onUpdateSets: (exerciseId: string, sets: PlannedSet[]) => Promise<void>;
  onRemoveStep: (id: string) => Promise<void>;
  onDeleteFlow: () => Promise<void>;
  onClose: () => void;
}

export function FlowEditor({
  flow,
  onAddStep,
  onUpdateSets,
  onRemoveStep,
  onDeleteFlow,
  onClose,
}: FlowEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [configCatalog, setConfigCatalog] = useState<ExerciseCatalog | null>(null);
  const [editExerciseId, setEditExerciseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const exercises = stepsOf(flow);
  const steps = exercises.map((s) => ({
    id: s.id,
    name: s.exercise_catalog?.name ?? s.name,
    prescription: `${(s.gym_planned_sets ?? []).length} series`,
    muscleGroup: s.exercise_catalog?.muscle_group,
  }));

  const existingCatalogIds = exercises
    .map((s) => s.exercise_catalog_id)
    .filter(Boolean) as string[];

  async function savePlan(sets: PlannedSet[]) {
    if (!configCatalog) return;
    setLoading(true);
    try {
      if (editExerciseId) {
        await onUpdateSets(editExerciseId, sets);
      } else {
        await onAddStep(configCatalog.id, sets);
      }
    } finally {
      setLoading(false);
      setConfigCatalog(null);
      setEditExerciseId(null);
    }
  }

  const editingExercise = editExerciseId
    ? exercises.find((e) => e.id === editExerciseId)
    : null;

  return (
    <>
      {pickerOpen && (
        <ExercisePicker
          excludeIds={existingCatalogIds}
          onSelect={(c) => {
            setConfigCatalog(c);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {configCatalog && (
        <SetPlanEditor
          catalog={configCatalog}
          initialSets={
            editingExercise?.gym_planned_sets?.length
              ? editingExercise.gym_planned_sets
              : defaultPlannedSets(configCatalog)
          }
          onSave={savePlan}
          onCancel={() => {
            setConfigCatalog(null);
            setEditExerciseId(null);
          }}
        />
      )}

      <div className="fixed inset-0 z-[60] flex flex-col bg-background">
        <header className="flex items-center gap-3 border-b border-border px-4 py-4 pt-safe">
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="grok-label">Editar</p>
            <p className="truncate text-sm font-medium">{flow.name}</p>
          </div>
          <button
            type="button"
            onClick={onDeleteFlow}
            className="rounded-full p-2 text-muted hover:text-danger"
          >
            <Trash2 size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <Card className="mb-4 p-4">
            <FlowChainVertical steps={steps} onRemove={(id) => onRemoveStep(id)} />
            {exercises.map((ex) => (
              <button
                key={ex.id}
                type="button"
                disabled={loading || !ex.exercise_catalog}
                onClick={() => {
                  if (ex.exercise_catalog) {
                    setEditExerciseId(ex.id);
                    setConfigCatalog(ex.exercise_catalog);
                  }
                }}
                className="mt-2 w-full text-left text-xs text-accent-soft underline disabled:opacity-40"
              >
                Series · {ex.name}
              </button>
            ))}
          </Card>
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            disabled={loading}
            onClick={() => setPickerOpen(true)}
          >
            <Plus size={18} />
            Añadir del catálogo
          </Button>
        </div>
      </div>
    </>
  );
}
