"use client";

import { Check, LayoutGrid, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ExerciseMedia } from "@/components/gym/ExerciseMedia";
import { FlowThread } from "@/components/gym/FlowThread";
import { formatEquipment } from "@/lib/gym/catalog-labels";
import { parseInstructionSteps, titleCaseToken } from "@/lib/gym/instructions";
import type { Flow } from "@/lib/gym/flow";
import { isTimeBased, type PlannedSet } from "@/lib/gym/sets";
import type { GymExercise } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ActiveExerciseStageProps {
  flow: Flow;
  exercise: GymExercise;
  exerciseIndex: number;
  sets: PlannedSet[];
  setIndex: number;
  completedKeys: Set<string>;
  elapsedLabel: string;
  onExit: () => void;
  onOpenSwitcher: () => void;
  onUpdateSet: (patch: Partial<PlannedSet>) => void;
  onCompleteSet: () => void;
  onSkipSet: () => void;
}

function setKey(exerciseId: string, setNumber: number) {
  return `${exerciseId}-${setNumber}`;
}

export function ActiveExerciseStage({
  flow,
  exercise,
  exerciseIndex,
  sets,
  setIndex,
  completedKeys,
  elapsedLabel,
  onExit,
  onOpenSwitcher,
  onUpdateSet,
  onCompleteSet,
  onSkipSet,
}: ActiveExerciseStageProps) {
  const catalog = exercise.exercise_catalog;
  const currentSet = sets[setIndex];
  const timeBased = isTimeBased(catalog?.execution_mode);

  if (!currentSet) return null;

  const doneCount = sets.filter((s) => completedKeys.has(setKey(exercise.id, s.set_number))).length;
  const remaining = sets.filter((s) => !completedKeys.has(setKey(exercise.id, s.set_number))).length;
  const steps = parseInstructionSteps(catalog?.instructions ?? "");
  const instruction =
    steps[(currentSet.set_number - 1) % Math.max(steps.length, 1)] ??
    catalog?.exercise_tips?.[0] ??
    "";

  const targetMuscles = catalog?.target_muscles ?? [];
  const secondaryMuscles = catalog?.secondary_muscles?.slice(0, 2) ?? [];
  const bodyParts = catalog?.body_parts ?? [];
  const equipments = catalog?.equipment ?? [];

  return (
    <div className="fixed inset-0 z-[70] flex h-dvh flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border px-3 py-2 pt-safe">
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={onExit} className="rounded-full p-2 text-muted active:scale-[0.99]">
            <X size={18} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[10px] uppercase tracking-widest text-muted">{flow.name}</p>
            <FlowThread flow={flow} activeIndex={exerciseIndex} compact />
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs text-accent">{elapsedLabel}</span>
            <button type="button" onClick={onOpenSwitcher} className="rounded-full p-2 text-muted active:scale-[0.99]">
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-3 py-2">
        <div className="grid min-h-0 flex-1 grid-cols-[38%_1fr] gap-2.5">
          <div className="flex flex-col gap-2">
            {catalog ? (
              <ExerciseMedia exercise={catalog} session className="w-full shrink-0" />
            ) : (
              <div className="aspect-square w-full rounded-[20px] border border-border bg-surface-muted" />
            )}
            <SetProgressDots
              sets={sets}
              activeIndex={setIndex}
              completedKeys={completedKeys}
              exerciseId={exercise.id}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-1.5 overflow-hidden">
            <div>
              <h1 className="line-clamp-2 text-base font-semibold leading-tight tracking-tight">
                {exercise.name}
              </h1>
              <p className="mt-0.5 font-mono text-[11px] text-accent">
                Serie {currentSet.set_number}/{sets.length}
                {remaining > 0 && <span className="text-muted"> · {remaining} restantes</span>}
              </p>
            </div>

            <div className="flex flex-wrap gap-1">
              {bodyParts.slice(0, 2).map((part) => (
                <Chip key={part} accent>
                  {titleCaseToken(part)}
                </Chip>
              ))}
              {targetMuscles.slice(0, 2).map((muscle) => (
                <Chip key={muscle}>{titleCaseToken(muscle)}</Chip>
              ))}
              {secondaryMuscles.map((muscle) => (
                <Chip key={muscle} muted>
                  {titleCaseToken(muscle)}
                </Chip>
              ))}
            </div>

            {(equipments.length > 0 || catalog?.muscle_subgroup) && (
              <p className="line-clamp-1 text-[10px] text-muted">
                {[catalog?.muscle_subgroup, formatEquipment(equipments)].filter(Boolean).join(" · ")}
              </p>
            )}

            {instruction && (
              <p className="line-clamp-3 flex-1 text-[11px] leading-snug text-secondary">{instruction}</p>
            )}
          </div>
        </div>

        <div className="mt-2 shrink-0">
          {timeBased ? (
            <div className="grid grid-cols-2 gap-2">
              <MetricField
                label="Segundos"
                value={currentSet.target_seconds ?? ""}
                onChange={(v) => onUpdateSet({ target_seconds: v ? Number(v) : null })}
              />
              <MetricField
                label="Descanso"
                value={currentSet.rest_seconds}
                suffix="s"
                onChange={(v) => onUpdateSet({ rest_seconds: Number(v) || 60 })}
              />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              <MetricField
                label="Reps"
                value={currentSet.target_reps ?? ""}
                onChange={(v) => onUpdateSet({ target_reps: v ? Number(v) : null })}
              />
              <MetricField
                label="Peso"
                value={currentSet.target_weight_kg ?? ""}
                suffix="kg"
                onChange={(v) => onUpdateSet({ target_weight_kg: v ? Number(v) : null })}
              />
              <MetricField
                label="RIR"
                value={currentSet.target_rir ?? ""}
                onChange={(v) => onUpdateSet({ target_rir: v ? Number(v) : null })}
              />
              <MetricField
                label="Rest"
                value={currentSet.rest_seconds}
                suffix="s"
                onChange={(v) => onUpdateSet({ rest_seconds: Number(v) || 60 })}
              />
            </div>
          )}
        </div>
      </div>

      <footer className="shrink-0 grid grid-cols-2 gap-2 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button variant="outline" size="lg" className="gap-1.5" onClick={onSkipSet}>
          <SkipForward size={16} />
          Omitir
        </Button>
        <Button size="lg" className="gap-1.5" onClick={onCompleteSet}>
          <Check size={16} />
          Completar
        </Button>
      </footer>
    </div>
  );
}

function Chip({
  children,
  accent,
  muted,
}: {
  children: React.ReactNode;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide",
        accent && "bg-accent/15 text-accent",
        muted && "border border-border text-muted",
        !accent && !muted && "bg-surface-muted text-secondary"
      )}
    >
      {children}
    </span>
  );
}

function MetricField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-2xl border border-border bg-surface px-2 py-1.5">
      <span className="grok-label text-[9px]">{label}</span>
      <div className="mt-0.5 flex items-baseline gap-0.5">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          className="w-full min-w-0 bg-transparent font-mono text-lg leading-none text-secondary outline-none"
        />
        {suffix && <span className="shrink-0 text-[10px] text-muted">{suffix}</span>}
      </div>
    </label>
  );
}

function SetProgressDots({
  sets,
  activeIndex,
  completedKeys,
  exerciseId,
}: {
  sets: PlannedSet[];
  activeIndex: number;
  completedKeys: Set<string>;
  exerciseId: string;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 px-1">
      {sets.map((set, i) => {
        const done = completedKeys.has(setKey(exerciseId, set.set_number));
        const active = i === activeIndex;
        return (
          <div
            key={set.set_number}
            className={cn(
              "rounded-full transition-all duration-200",
              active ? "h-2.5 w-2.5 bg-accent grok-glow" : "h-2 w-2",
              done && !active && "bg-success",
              !done && !active && "bg-surface-muted"
            )}
          />
        );
      })}
    </div>
  );
}
