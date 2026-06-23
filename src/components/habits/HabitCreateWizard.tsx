"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { FOUR_LAWS, IDENTITY_PREFIX, habitPalette } from "@/styles/branding";
import { buildImplementationIntention } from "@/lib/habits/stats";
import type { CreateHabitPayload, Habit, HabitKind } from "@/lib/types";
import { DAYS_SHORT, cn } from "@/lib/utils";

const STEPS = [
  { id: "identity", title: "Identidad", subtitle: "¿En quién te conviertes?" },
  { id: "intention", title: "Intención", subtitle: "Cuando X, haré Y" },
  ...FOUR_LAWS.map((l) => ({ id: l.key, title: l.label, subtitle: l.hint })),
  { id: "stack", title: "Apilar", subtitle: "Encadena con un hábito existente" },
  { id: "schedule", title: "Ritmo", subtitle: "Días y tipo" },
] as const;

interface Props {
  existingHabits: Habit[];
  onSubmit: (payload: CreateHabitPayload) => Promise<void>;
  onCancel: () => void;
}

export function HabitCreateWizard({ existingHabits, onSubmit, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    identity_link: "",
    cue: "",
    name: "",
    craving: "",
    two_minute_version: "",
    reward: "",
    stack_after_habit_id: "" as string | "",
    habit_kind: "build" as HabitKind,
    target_days: [0, 1, 2, 3, 4, 5, 6] as number[],
    color: habitPalette[0],
  });

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function set(field: string, value: string | number[] | HabitKind) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleDay(day: number) {
    setForm((f) => ({
      ...f,
      target_days: f.target_days.includes(day)
        ? f.target_days.filter((d) => d !== day)
        : [...f.target_days, day].sort(),
    }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        color: form.color,
        target_days: form.target_days,
        identity_link: form.identity_link,
        cue: form.cue,
        craving: form.craving,
        two_minute_version: form.two_minute_version,
        reward: form.reward,
        stack_after_habit_id: form.stack_after_habit_id || null,
        implementation_intention: buildImplementationIntention(form.cue, form.name),
        habit_kind: form.habit_kind,
      });
    } finally {
      setLoading(false);
    }
  }

  const canNext =
    step === 0 ||
    step === 1 ||
    step === 2 ||
    step === 3 ||
    step === 4 ||
    step === 5 ||
    step === 6 ||
    (step === 7 && form.name.trim());

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <div className="mb-3 flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn("h-0.5 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-surface-muted")}
            />
          ))}
        </div>
        <p className="grok-label">{current.title}</p>
        <p className="text-sm text-secondary">{current.subtitle}</p>
      </div>

      <div className="space-y-4 p-4">
        {step === 0 && (
          <>
            <p className="text-xs text-muted">{IDENTITY_PREFIX}…</p>
            <Textarea
              placeholder="…medita cada mañana"
              value={form.identity_link}
              onChange={(e) => set("identity_link", e.currentTarget.value)}
              rows={3}
            />
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <Label>Cuando… (señal)</Label>
              <Input
                placeholder="Termine mi café matutino"
                value={form.cue}
                onChange={(e) => set("cue", e.currentTarget.value)}
              />
            </div>
            <div>
              <Label>Haré… (acción)</Label>
              <Input
                placeholder="Meditar 10 minutos"
                value={form.name}
                onChange={(e) => set("name", e.currentTarget.value)}
              />
            </div>
            {form.cue && form.name && (
              <p className="rounded-xl bg-surface-muted px-3 py-2 text-sm text-accent-soft">
                {buildImplementationIntention(form.cue, form.name)}
              </p>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Label>Señal visible (Obvio)</Label>
            <Input
              placeholder="Cojín de meditación junto al sofá"
              value={form.cue}
              onChange={(e) => set("cue", e.currentTarget.value)}
            />
          </>
        )}

        {step === 3 && (
          <>
            <Label>Motivación (Atractivo)</Label>
            <Textarea
              placeholder="Me sentiré centrado antes de trabajar"
              value={form.craving}
              onChange={(e) => set("craving", e.currentTarget.value)}
            />
          </>
        )}

        {step === 4 && (
          <>
            <Label>Versión de 2 minutos (Fácil)</Label>
            <Input
              placeholder="Respirar profundo 2 minutos"
              value={form.two_minute_version}
              onChange={(e) => set("two_minute_version", e.currentTarget.value)}
            />
            {!form.name && (
              <>
                <Label className="mt-3">Nombre del hábito</Label>
                <Input
                  placeholder="Meditar"
                  value={form.name}
                  onChange={(e) => set("name", e.currentTarget.value)}
                />
              </>
            )}
          </>
        )}

        {step === 5 && (
          <>
            <Label>Recompensa (Satisfactorio)</Label>
            <Input
              placeholder="Marcar ✓ y tomar té"
              value={form.reward}
              onChange={(e) => set("reward", e.currentTarget.value)}
            />
          </>
        )}

        {step === 6 && (
          <>
            <Label>Después de… (opcional)</Label>
            <select
              className="h-12 w-full rounded-2xl border border-border bg-surface-raised px-4 text-foreground outline-none focus:border-accent-soft"
              value={form.stack_after_habit_id}
              onChange={(e) => set("stack_after_habit_id", e.currentTarget.value)}
            >
              <option value="">Sin apilar</option>
              {existingHabits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </>
        )}

        {step === 7 && (
          <>
            <div className="mb-4 flex gap-2">
              {(["build", "break"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set("habit_kind", k)}
                  className={cn(
                    "flex-1 rounded-2xl border py-3 text-sm transition-colors",
                    form.habit_kind === k
                      ? "border-accent-soft bg-accent/10 text-accent"
                      : "border-border text-muted"
                  )}
                >
                  {k === "build" ? "Construir +" : "Eliminar −"}
                </button>
              ))}
            </div>
            <Label>Días activos</Label>
            <div className="flex gap-1">
              {DAYS_SHORT.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium",
                    form.target_days.includes(i)
                      ? "bg-accent text-background"
                      : "bg-surface-muted text-muted"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            <Label className="mt-4">Color</Label>
            <div className="flex gap-2">
              {habitPalette.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2",
                    form.color === c ? "border-accent scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 border-t border-border p-4">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} className="gap-1">
            <ChevronLeft size={16} /> Atrás
          </Button>
        ) : (
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        {!isLast ? (
          <Button
            className="ml-auto gap-1"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
          >
            Siguiente <ChevronRight size={16} />
          </Button>
        ) : (
          <Button className="ml-auto" disabled={!form.name.trim() || loading} onClick={handleSubmit}>
            {loading ? "Creando…" : "Crear hábito"}
          </Button>
        )}
      </div>
    </Card>
  );
}
