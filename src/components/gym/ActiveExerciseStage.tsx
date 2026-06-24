"use client";

import { Check, CheckCheck, LayoutGrid, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ExerciseMedia } from "@/components/gym/ExerciseMedia";
import { FlowThread } from "@/components/gym/FlowThread";
import { EXECUTION_MODE_LABELS, EXERCISE_TYPE_LABELS, formatEquipment } from "@/lib/gym/catalog-labels";
import { parseInstructionSteps } from "@/lib/gym/instructions";
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
  onCompleteExercise: () => void;
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
  onCompleteExercise,
  onSkipSet,
}: ActiveExerciseStageProps) {
  const catalog = exercise.exercise_catalog;
  const currentSet = sets[setIndex];
  const timeBased = isTimeBased(catalog?.execution_mode);

  if (!currentSet) return null;

  const doneCount = sets.filter((s) => completedKeys.has(setKey(exercise.id, s.set_number))).length;
  const remainingCount = sets.length - doneCount;
  const steps = parseInstructionSteps(catalog?.instructions ?? "");
  const instruction =
    steps[(currentSet.set_number - 1) % Math.max(steps.length, 1)] ??
    catalog?.exercise_tips?.[0] ??
    "";

  return (
    <div className="fixed inset-0 z-[70] flex h-dvh flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border px-4 py-2 pt-safe">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onExit} className="rounded-full p-2 text-muted active:scale-[0.98]">
            <X size={20} />
          </button>
          <span className="font-mono text-sm text-accent">{elapsedLabel}</span>
          <button
            type="button"
            onClick={onOpenSwitcher}
            className="rounded-full p-2 text-muted active:scale-[0.98]"
          >
            <LayoutGrid size={20} />
          </button>
        </div>
        <div className="mt-1.5 flex flex-col items-center text-center">
          <p className="grok-label max-w-full truncate">{flow.name}</p>
          <FlowThread flow={flow} activeIndex={exerciseIndex} compact className="justify-center" />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4">
        <div className="flex shrink-0 justify-center pt-3">
          {catalog ? (
            <ExerciseMedia
              exercise={catalog}
              session
              className="aspect-square w-full max-w-[min(72vw,15.5rem)]"
            />
          ) : (
            <div className="aspect-square w-full max-w-[min(72vw,15.5rem)] rounded-2xl border border-border bg-surface-muted" />
          )}
        </div>

        <div className="my-auto flex min-h-0 shrink-0 flex-col items-center px-1 pt-4 text-center">
          <h1 className="line-clamp-2 text-lg font-semibold leading-tight tracking-tight">
            {exercise.name}
          </h1>
          <p className="mt-1 text-xs text-muted">
            Serie {currentSet.set_number} de {sets.length} · {doneCount} completadas
          </p>
          {remainingCount > 1 && (
            <button
              type="button"
              onClick={onCompleteExercise}
              className="mt-2 inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] text-secondary active:scale-[0.98]"
            >
              <CheckCheck size={12} />
              Completar ejercicio ({remainingCount} series)
            </button>
          )}

          {catalog && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[10px]">
              <Chip accent>{catalog.muscle_group}</Chip>
              {catalog.muscle_subgroup && <Chip>{catalog.muscle_subgroup}</Chip>}
              <Chip muted>{EXERCISE_TYPE_LABELS[catalog.exercise_type] ?? catalog.exercise_type}</Chip>
              <Chip muted>
                {EXECUTION_MODE_LABELS[catalog.execution_mode] ?? catalog.execution_mode}
              </Chip>
            </div>
          )}

          {catalog?.equipment?.length ? (
            <p className="mt-1.5 max-w-full truncate text-xs text-secondary">
              {formatEquipment(catalog.equipment)}
            </p>
          ) : null}

          {instruction && (
            <p className="mt-1.5 line-clamp-2 max-w-sm text-xs leading-snug text-secondary">
              {instruction}
            </p>
          )}

          <SetProgressDots
            sets={sets}
            activeIndex={setIndex}
            completedKeys={completedKeys}
            exerciseId={exercise.id}
          />
        </div>

        <div className="shrink-0 pb-2 pt-1">
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
            <div className="grid grid-cols-2 gap-2">
              <MetricField
                label="Repeticiones"
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
                label="Descanso"
                value={currentSet.rest_seconds}
                suffix="s"
                onChange={(v) => onUpdateSet({ rest_seconds: Number(v) || 60 })}
              />
            </div>
          )}
        </div>
      </div>

      <footer className="shrink-0 grid grid-cols-2 gap-2 border-t border-border px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Button variant="outline" className="h-11 gap-1.5" onClick={onSkipSet}>
          <SkipForward size={16} />
          Omitir
        </Button>
        <Button className="h-11 gap-1.5" onClick={onCompleteSet}>
          <Check size={16} />
          Completar serie
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
        "rounded-full px-2 py-0.5",
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
    <label className="block rounded-xl border border-border bg-surface px-2.5 py-2">
      <span className="grok-label text-[9px]">{label}</span>
      <div className="mt-0.5 flex items-baseline gap-1">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          className="w-full min-w-0 bg-transparent font-mono text-xl leading-none text-foreground outline-none"
        />
        {suffix && <span className="shrink-0 text-xs text-muted">{suffix}</span>}
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
    <div className="mt-2.5 flex items-center justify-center gap-1.5">
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
