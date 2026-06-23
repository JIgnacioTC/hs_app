"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { isTimeBased, type PlannedSet } from "@/lib/gym/sets";
import type { ExerciseCatalog } from "@/lib/types";

interface SetPlanEditorProps {
  catalog: ExerciseCatalog;
  initialSets: PlannedSet[];
  onSave: (sets: PlannedSet[]) => void;
  onCancel: () => void;
  title?: string;
}

function NumInput({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-muted"
          onClick={() => onChange(Math.max(0, (value ?? 0) - step))}
        >
          <Minus size={14} />
        </button>
        <Input
          className="text-center font-mono"
          type="number"
          value={value ?? ""}
          onChange={(e) => {
            const v = e.currentTarget.value;
            onChange(v === "" ? null : Number(v));
          }}
        />
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-muted"
          onClick={() => onChange((value ?? 0) + step)}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export function SetPlanEditor({
  catalog,
  initialSets,
  onSave,
  onCancel,
  title = "Configurar series",
}: SetPlanEditorProps) {
  const timeBased = isTimeBased(catalog.execution_mode);
  const [sets, setSets] = useState<PlannedSet[]>(
    initialSets.length ? initialSets : [{ set_number: 1, target_reps: 10, target_seconds: null, target_weight_kg: null, target_rir: 2, rest_seconds: catalog.rest_seconds }]
  );

  function updateSet(index: number, patch: Partial<PlannedSet>) {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSet() {
    const last = sets[sets.length - 1];
    setSets((prev) => [
      ...prev,
      {
        set_number: prev.length + 1,
        target_reps: last?.target_reps ?? 10,
        target_seconds: last?.target_seconds ?? 45,
        target_weight_kg: last?.target_weight_kg ?? null,
        target_rir: last?.target_rir ?? 2,
        rest_seconds: last?.rest_seconds ?? catalog.rest_seconds,
      },
    ]);
  }

  function removeSet(index: number) {
    setSets((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, set_number: i + 1 }))
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background">
      <header className="border-b border-border px-4 py-4 pt-safe">
        <p className="grok-label">{title}</p>
        <h2 className="text-lg font-semibold">{catalog.name}</h2>
        <p className="text-xs text-muted">{catalog.muscle_subgroup}</p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {sets.map((set, i) => (
          <Card key={i} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-sm text-accent">Serie {set.set_number}</span>
              {sets.length > 1 && (
                <button type="button" onClick={() => removeSet(i)} className="text-muted hover:text-danger">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {timeBased ? (
                <NumInput
                  label="Segundos"
                  value={set.target_seconds}
                  onChange={(v) => updateSet(i, { target_seconds: v })}
                  step={5}
                />
              ) : (
                <>
                  <NumInput
                    label="Reps"
                    value={set.target_reps}
                    onChange={(v) => updateSet(i, { target_reps: v })}
                  />
                  <NumInput
                    label="Peso (kg)"
                    value={set.target_weight_kg}
                    onChange={(v) => updateSet(i, { target_weight_kg: v })}
                    step={2.5}
                  />
                  <NumInput
                    label="RIR"
                    value={set.target_rir}
                    onChange={(v) => updateSet(i, { target_rir: v })}
                    step={1}
                  />
                </>
              )}
              <NumInput
                label="Descanso (s)"
                value={set.rest_seconds}
                onChange={(v) => updateSet(i, { rest_seconds: v ?? 60 })}
                step={15}
              />
            </div>
          </Card>
        ))}
        <Button variant="outline" onClick={addSet} className="gap-2">
          <Plus size={16} /> Añadir serie
        </Button>
      </div>

      <div className="flex gap-2 border-t border-border p-4 pb-8 safe-bottom">
        <Button variant="ghost" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={() => onSave(sets)} className="flex-1">
          Guardar
        </Button>
      </div>
    </div>
  );
}
