"use client";

import { useState } from "react";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ExercisePicker } from "@/components/gym/ExercisePicker";
import { SetPlanEditor } from "@/components/gym/SetPlanEditor";
import { FlowChainVertical } from "@/components/gym/FlowThread";
import { FLOW_MOODS, type FlowDraftStep, draftFromCatalog } from "@/lib/gym/flow";
import { defaultPlannedSets, type PlannedSet } from "@/lib/gym/sets";
import type { ExerciseCatalog } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FlowForgeProps {
  onSave: (data: {
    name: string;
    mood: string;
    steps: FlowDraftStep[];
  }) => Promise<void>;
  onCancel: () => void;
}

export function FlowForge({ onSave, onCancel }: FlowForgeProps) {
  const [phase, setPhase] = useState<"intent" | "chain">("intent");
  const [name, setName] = useState("");
  const [mood, setMood] = useState<string>("pulse");
  const [steps, setSteps] = useState<FlowDraftStep[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [configCatalog, setConfigCatalog] = useState<ExerciseCatalog | null>(null);
  const [editStepId, setEditStepId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function afterCatalogPick(catalog: ExerciseCatalog) {
    setConfigCatalog(catalog);
    setPickerOpen(false);
  }

  function savePlan(sets: PlannedSet[]) {
    if (!configCatalog) return;
    if (editStepId) {
      setSteps((prev) =>
        prev.map((s) => (s.id === editStepId ? { ...s, planned_sets: sets } : s))
      );
      setEditStepId(null);
    } else {
      setSteps((s) => [...s, draftFromCatalog(configCatalog, sets)]);
    }
    setConfigCatalog(null);
  }

  async function handleSave() {
    if (!name.trim() || !steps.length) return;
    setLoading(true);
    try {
      await onSave({ name: name.trim(), mood, steps });
    } finally {
      setLoading(false);
    }
  }

  const chainSteps = steps.map((s) => ({
    id: s.id,
    name: s.name,
    prescription: `${s.planned_sets.length} series`,
    muscleGroup: s.muscleGroup,
  }));

  const editingStep = editStepId ? steps.find((s) => s.id === editStepId) : null;

  return (
    <>
      {pickerOpen && (
        <ExercisePicker
          excludeIds={steps.map((s) => s.catalogId)}
          onSelect={afterCatalogPick}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {configCatalog && (
        <SetPlanEditor
          catalog={configCatalog}
          initialSets={editingStep?.planned_sets ?? defaultPlannedSets(configCatalog)}
          onSave={savePlan}
          onCancel={() => {
            setConfigCatalog(null);
            setEditStepId(null);
          }}
        />
      )}

      <div className="fixed inset-0 z-[60] flex flex-col bg-background">
        <header className="flex items-center gap-3 border-b border-border px-4 py-4 pt-safe">
          <button type="button" onClick={onCancel} className="rounded-full p-2 text-muted hover:text-foreground">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="grok-label">Nuevo flujo</p>
            <p className="text-sm text-secondary">
              {phase === "intent" ? "Intención" : "Armar cadena"}
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {phase === "intent" ? (
            <div className="mx-auto max-w-md space-y-6">
              <div>
                <Label>Nombre del flujo</Label>
                <Input
                  placeholder="Ej: Silencio matutino"
                  value={name}
                  onChange={(e) => setName(e.currentTarget.value)}
                  autoFocus
                />
              </div>
              <div>
                <Label>Energía</Label>
                <div className="grid grid-cols-2 gap-2">
                  {FLOW_MOODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMood(m.id)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition-all",
                        mood === m.id
                          ? "border-accent-soft bg-accent/10"
                          : "border-border hover:border-accent-soft/40"
                      )}
                    >
                      <p className="font-medium text-sm">{m.label}</p>
                      <p className="mt-1 text-xs text-muted">{m.hint}</p>
                    </button>
                  ))}
                </div>
              </div>
              <Button size="lg" disabled={!name.trim()} onClick={() => setPhase("chain")}>
                Continuar
              </Button>
            </div>
          ) : (
            <div className="mx-auto max-w-md">
              <Card className="mb-4 p-4">
                <FlowChainVertical
                  steps={chainSteps}
                  onRemove={(id) => setSteps((s) => s.filter((x) => x.id !== id))}
                />
                {steps.length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-border pt-3">
                    {steps.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (s.catalog) {
                            setEditStepId(s.id);
                            setConfigCatalog(s.catalog);
                          }
                        }}
                        className="w-full text-left text-xs text-accent-soft underline"
                      >
                        Editar series · {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </Card>

              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => setPickerOpen(true)}
              >
                <Plus size={18} />
                Elegir del catálogo
              </Button>

              <Button
                size="lg"
                className="mt-4 gap-2"
                disabled={!steps.length || loading}
                onClick={handleSave}
              >
                <Check size={18} />
                {loading ? "Forjando…" : "Guardar flujo"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
