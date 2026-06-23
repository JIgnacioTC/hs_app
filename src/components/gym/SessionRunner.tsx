"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, LayoutGrid, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { RestTimer } from "@/components/gym/RestTimer";
import { ExerciseHistorySheet } from "@/components/gym/ExerciseHistorySheet";
import { SetPlanEditor } from "@/components/gym/SetPlanEditor";
import { FlowThread } from "@/components/gym/FlowThread";
import { api } from "@/lib/api-client";
import { stepsOf } from "@/lib/gym/flow";
import type { Flow } from "@/lib/gym/flow";
import { isTimeBased, type ExerciseHistory, type PlannedSet } from "@/lib/gym/sets";
import type { GymExercise, GymSession } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SessionRunnerProps {
  session: GymSession;
  flow: Flow;
  onComplete: () => Promise<void>;
  onExit: () => void;
}

function setKey(exerciseId: string, setNumber: number) {
  return `${exerciseId}-${setNumber}`;
}

export function SessionRunner({ session, flow, onComplete, onExit }: SessionRunnerProps) {
  const exercises = useMemo(() => stepsOf(flow), [flow]);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [plannedMap, setPlannedMap] = useState<Record<string, PlannedSet[]>>(() => {
    const map: Record<string, PlannedSet[]> = {};
    for (const ex of exercises) {
      map[ex.id] = (ex.gym_planned_sets ?? []).sort((a, b) => a.set_number - b.set_number);
    }
    return map;
  });
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"work" | "rest">("work");
  const [restSeconds, setRestSeconds] = useState(0);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ExerciseHistory | null>(null);
  const [editSets, setEditSets] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const exercise = exercises[exerciseIndex];
  const sets = exercise ? plannedMap[exercise.id] ?? [] : [];
  const currentSet = sets[setIndex];
  const timeBased = isTimeBased(exercise?.exercise_catalog?.execution_mode);

  useEffect(() => {
    const start = new Date(session.started_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session.started_at]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const updateCurrentSet = (patch: Partial<PlannedSet>) => {
    if (!exercise || !currentSet) return;
    setPlannedMap((prev) => ({
      ...prev,
      [exercise.id]: prev[exercise.id].map((s, i) =>
        i === setIndex ? { ...s, ...patch } : s
      ),
    }));
  };

  const advanceAfterRest = useCallback(() => {
    setMode("work");
    if (setIndex < sets.length - 1) {
      setSetIndex((i) => i + 1);
      return;
    }
    if (exerciseIndex < exercises.length - 1) {
      setExerciseIndex((i) => i + 1);
      setSetIndex(0);
      return;
    }
    setFinishing(true);
    setTimeout(() => void onComplete(), 1200);
  }, [setIndex, sets.length, exerciseIndex, exercises.length, onComplete]);

  async function completeSet() {
    if (!exercise || !currentSet) return;

    await api.post(`/api/gym/sessions/${session.id}/sets`, {
      gym_exercise_id: exercise.id,
      exercise_catalog_id: exercise.exercise_catalog_id,
      set_number: currentSet.set_number,
      reps: timeBased ? null : currentSet.target_reps,
      duration_seconds: timeBased ? currentSet.target_seconds : null,
      weight_kg: currentSet.target_weight_kg,
      rir: currentSet.target_rir,
    });

    setCompleted((prev) => new Set(prev).add(setKey(exercise.id, currentSet.set_number)));
    setRestSeconds(currentSet.rest_seconds);
    setMode("rest");
  }

  async function openHistory() {
    if (!exercise?.exercise_catalog_id) return;
    const data = await api.get<ExerciseHistory>(
      `/api/gym/history/${exercise.exercise_catalog_id}`
    );
    setHistory(data);
    setShowHistory(true);
  }

  function jumpTo(index: number) {
    setExerciseIndex(index);
    const ex = exercises[index];
    const exSets = plannedMap[ex.id] ?? [];
    const firstIncomplete = exSets.findIndex(
      (s) => !completed.has(setKey(ex.id, s.set_number))
    );
    setSetIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
    setShowSwitcher(false);
    setMode("work");
  }

  const nextLabel =
    setIndex < sets.length - 1
      ? `Serie ${setIndex + 2}`
      : exerciseIndex < exercises.length - 1
        ? exercises[exerciseIndex + 1]?.name ?? "Siguiente"
        : "Finalizar";

  if (finishing) {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-background">
        <p className="grok-label text-success">Sesión completa</p>
        <p className="mt-2 font-mono text-3xl">{formatElapsed(elapsed)}</p>
      </div>
    );
  }

  if (mode === "rest") {
    return (
      <RestTimer
        initialSeconds={restSeconds}
        onFinish={advanceAfterRest}
        exerciseName={exercise?.name ?? ""}
        nextLabel={nextLabel}
      />
    );
  }

  if (editSets && exercise?.exercise_catalog) {
    return (
      <SetPlanEditor
        catalog={exercise.exercise_catalog}
        initialSets={sets}
        title="Ajustar series (sesión)"
        onCancel={() => setEditSets(false)}
        onSave={(newSets) => {
          setPlannedMap((prev) => ({ ...prev, [exercise.id]: newSets }));
          if (setIndex >= newSets.length) setSetIndex(Math.max(0, newSets.length - 1));
          setEditSets(false);
        }}
      />
    );
  }

  if (showHistory && history) {
    return <ExerciseHistorySheet history={history} onClose={() => setShowHistory(false)} />;
  }

  if (!exercise || !currentSet) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background p-6">
        <p className="text-muted">Sin series configuradas</p>
        <Button className="mt-4" onClick={onExit}>
          Salir
        </Button>
      </div>
    );
  }

  const doneCount = sets.filter((s) => completed.has(setKey(exercise.id, s.set_number))).length;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background">
      <header className="border-b border-border px-4 py-3 pt-safe">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={onExit} className="rounded-full p-2 text-muted">
            <X size={20} />
          </button>
          <span className="font-mono text-sm text-accent">{formatElapsed(elapsed)}</span>
          <button
            type="button"
            onClick={() => setShowSwitcher(true)}
            className="rounded-full p-2 text-muted"
          >
            <LayoutGrid size={20} />
          </button>
        </div>
        <p className="grok-label">{flow.name}</p>
        <FlowThread flow={flow} activeIndex={exerciseIndex} compact />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-6 flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{exercise.name}</h1>
            <p className="text-sm text-muted">
              Serie {currentSet.set_number} de {sets.length} · {doneCount} hechas
            </p>
          </div>
          <div className="flex gap-2">
            {exercise.exercise_catalog_id && (
              <button type="button" onClick={openHistory} className="text-xs text-accent-soft underline">
                Historial
              </button>
            )}
            <button type="button" onClick={() => setEditSets(true)} className="text-xs text-muted underline">
              Editar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {timeBased ? (
            <div className="col-span-2">
              <Label>Segundos</Label>
              <Input
                type="number"
                className="font-mono text-lg"
                value={currentSet.target_seconds ?? ""}
                onChange={(e) =>
                  updateCurrentSet({
                    target_seconds: e.currentTarget.value ? Number(e.currentTarget.value) : null,
                  })
                }
              />
            </div>
          ) : (
            <>
              <div>
                <Label>Reps</Label>
                <Input
                  type="number"
                  className="font-mono text-lg"
                  value={currentSet.target_reps ?? ""}
                  onChange={(e) =>
                    updateCurrentSet({
                      target_reps: e.currentTarget.value ? Number(e.currentTarget.value) : null,
                    })
                  }
                />
              </div>
              <div>
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.5"
                  className="font-mono text-lg"
                  value={currentSet.target_weight_kg ?? ""}
                  onChange={(e) =>
                    updateCurrentSet({
                      target_weight_kg: e.currentTarget.value ? Number(e.currentTarget.value) : null,
                    })
                  }
                />
              </div>
              <div>
                <Label>RIR</Label>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  className="font-mono text-lg"
                  value={currentSet.target_rir ?? ""}
                  onChange={(e) =>
                    updateCurrentSet({
                      target_rir: e.currentTarget.value ? Number(e.currentTarget.value) : null,
                    })
                  }
                />
              </div>
            </>
          )}
          <div>
            <Label>Descanso</Label>
            <Input
              type="number"
              className="font-mono"
              value={currentSet.rest_seconds}
              onChange={(e) =>
                updateCurrentSet({ rest_seconds: Number(e.currentTarget.value) || 60 })
              }
            />
          </div>
        </div>

        <ul className="mt-6 space-y-2">
          {sets.map((s, i) => {
            const done = completed.has(setKey(exercise.id, s.set_number));
            return (
              <li
                key={s.set_number}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-2 text-sm",
                  i === setIndex && "border-accent-soft bg-accent/5",
                  done && "opacity-50"
                )}
              >
                <span>Serie {s.set_number}</span>
                <span className="font-mono text-xs text-muted">
                  {timeBased
                    ? `${s.target_seconds}s`
                    : `${s.target_reps ?? "—"} × ${s.target_weight_kg ?? "—"} kg`}
                </span>
                {done && <Check size={14} className="text-success" />}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-border p-4 pb-8 safe-bottom">
        <Button size="lg" className="gap-2" onClick={completeSet}>
          <Check size={18} />
          Completar serie
        </Button>
      </div>

      {showSwitcher && (
        <div className="fixed inset-0 z-[80] bg-black/60" onClick={() => setShowSwitcher(false)}>
          <div
            className="absolute bottom-0 inset-x-0 max-h-[70vh] overflow-y-auto rounded-t-3xl border-t border-border bg-surface p-4 pb-8 safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="grok-label mb-4">Cambiar ejercicio</p>
            <div className="space-y-2">
              {exercises.map((ex, i) => {
                const exSets = plannedMap[ex.id] ?? [];
                const done = exSets.filter((s) => completed.has(setKey(ex.id, s.set_number))).length;
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => jumpTo(i)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border p-4 text-left",
                      i === exerciseIndex ? "border-accent-soft bg-accent/5" : "border-border"
                    )}
                  >
                    <span className="font-medium">{ex.name}</span>
                    <span className="font-mono text-xs text-muted">
                      {done}/{exSets.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
