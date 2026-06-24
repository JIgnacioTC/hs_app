"use client";

import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { ExercisePicker } from "@/components/gym/ExercisePicker";
import { SetPlanEditor } from "@/components/gym/SetPlanEditor";
import { FlowChainVertical } from "@/components/gym/FlowThread";
import { FLOW_MOODS, moodFromDescription, stepsOf } from "@/lib/gym/flow";
import type { Flow } from "@/lib/gym/flow";
import { defaultPlannedSets, type PlannedSet } from "@/lib/gym/sets";
import type { ExerciseCatalog } from "@/lib/types";

interface FlowEditorProps {
  flow: Flow;
  onAddStep: (catalogId: string, planned_sets: PlannedSet[]) => Promise<void>;
  onUpdateSets: (exerciseId: string, sets: PlannedSet[]) => Promise<void>;
  onUpdateFlow: (patch: { name?: string; description?: string }) => Promise<void>;
  onReorder: (exerciseId: string, sortOrder: number) => Promise<void>;
  onRemoveStep: (id: string) => Promise<void>;
  onDeleteFlow: () => Promise<void>;
  onClose: () => void;
}

export function FlowEditor({
  flow,
  onAddStep,
  onUpdateSets,
  onUpdateFlow,
  onReorder,
  onRemoveStep,
  onDeleteFlow,
  onClose,
}: FlowEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [configCatalog, setConfigCatalog] = useState<ExerciseCatalog | null>(null);
  const [editExerciseId, setEditExerciseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(flow.name);
  const [mood, setMood] = useState(flow.description ?? "pulse");
  const [confirmDeleteFlow, setConfirmDeleteFlow] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

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

  async function saveMeta() {
    setLoading(true);
    try {
      await onUpdateFlow({ name: name.trim() || flow.name, description: mood });
    } finally {
      setLoading(false);
    }
  }

  async function moveExercise(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= exercises.length) return;
    setLoading(true);
    try {
      await onReorder(exercises[index].id, target);
      await onReorder(exercises[target].id, index);
    } finally {
      setLoading(false);
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
            <p className="grok-label">Editar flujo</p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmDeleteFlow(true)}
            className="rounded-full p-2 text-muted hover:text-danger"
          >
            <Trash2 size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <Card className="mb-4 space-y-3 p-4">
            <Input
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="Nombre del flujo"
            />
            <div className="flex flex-wrap gap-2">
              {FLOW_MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    mood === m.id
                      ? "bg-accent text-background"
                      : "border border-border text-muted"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <Button size="sm" disabled={loading} onClick={() => void saveMeta()}>
              Guardar nombre y energía
            </Button>
            {moodFromDescription(mood) && (
              <p className="text-xs text-muted">{moodFromDescription(mood)?.hint}</p>
            )}
          </Card>

          <Card className="mb-4 p-4">
            <FlowChainVertical
              steps={steps}
              onRemove={(id) => setConfirmRemoveId(id)}
            />
            {exercises.map((ex, index) => (
              <div key={ex.id} className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={loading || index === 0}
                    onClick={() => void moveExercise(index, -1)}
                    className="rounded-lg border border-border p-2 text-muted disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={loading || index === exercises.length - 1}
                    onClick={() => void moveExercise(index, 1)}
                    className="rounded-lg border border-border p-2 text-muted disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={loading || !ex.exercise_catalog}
                  onClick={() => {
                    if (ex.exercise_catalog) {
                      setEditExerciseId(ex.id);
                      setConfigCatalog(ex.exercise_catalog);
                    }
                  }}
                  className="flex-1 text-left text-xs text-accent-soft underline disabled:opacity-40"
                >
                  Series · {ex.name}
                </button>
              </div>
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

      <ConfirmDialog
        open={confirmDeleteFlow}
        title="¿Eliminar flujo?"
        description="Se ocultará de tu lista. El historial de entrenamientos se conserva."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        danger
        onConfirm={() => {
          setConfirmDeleteFlow(false);
          void onDeleteFlow();
        }}
        onCancel={() => setConfirmDeleteFlow(false)}
      />

      <ConfirmDialog
        open={Boolean(confirmRemoveId)}
        title="¿Quitar ejercicio?"
        description="Se eliminará del flujo. Tus registros anteriores se mantienen en el historial."
        confirmLabel="Quitar"
        cancelLabel="Cancelar"
        danger
        onConfirm={() => {
          const id = confirmRemoveId;
          setConfirmRemoveId(null);
          if (id) void onRemoveStep(id);
        }}
        onCancel={() => setConfirmRemoveId(null)}
      />
    </>
  );
}
