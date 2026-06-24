"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActiveExerciseStage } from "@/components/gym/ActiveExerciseStage";
import { RestTimer } from "@/components/gym/RestTimer";
import { ExerciseHistorySheet } from "@/components/gym/ExerciseHistorySheet";
import { SetPlanEditor } from "@/components/gym/SetPlanEditor";
import { api } from "@/lib/api-client";
import { stepsOf } from "@/lib/gym/flow";
import type { Flow } from "@/lib/gym/flow";
import { isTimeBased, type ExerciseHistory, type PlannedSet } from "@/lib/gym/sets";
import { ensureNotificationPermission, showLocalNotification } from "@/lib/notifications";
import type { GymSession } from "@/lib/types";
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
  const sessionStarted = useRef(false);

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

  useEffect(() => {
    if (sessionStarted.current) return;
    sessionStarted.current = true;
    void ensureNotificationPermission();
  }, []);

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

  const nextLabel =
    setIndex < sets.length - 1
      ? `Serie ${setIndex + 2}`
      : exerciseIndex < exercises.length - 1
        ? exercises[exerciseIndex + 1]?.name ?? "Siguiente"
        : "Finalizar";

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
    void showLocalNotification("¡Sesión completa!", {
      body: `${flow.name} · ${formatElapsed(elapsed)}`,
      tag: "gym-session-complete",
      url: "/gym",
    });
    setTimeout(() => void onComplete(), 1200);
  }, [setIndex, sets.length, exerciseIndex, exercises.length, flow.name, elapsed, onComplete]);

  const advanceWithoutRest = useCallback(() => {
    if (!exercise || !currentSet) return;

    setCompleted((prev) => new Set(prev).add(setKey(exercise.id, currentSet.set_number)));

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
  }, [exercise, currentSet, setIndex, sets.length, exerciseIndex, exercises.length, onComplete]);

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

  async function completeAllSetsForExercise() {
    if (!exercise) return;

    const remaining = sets.filter(
      (s) => !completed.has(setKey(exercise.id, s.set_number))
    );
    if (!remaining.length) return;

    for (const set of remaining) {
      await api.post(`/api/gym/sessions/${session.id}/sets`, {
        gym_exercise_id: exercise.id,
        exercise_catalog_id: exercise.exercise_catalog_id,
        set_number: set.set_number,
        reps: timeBased ? null : set.target_reps,
        duration_seconds: timeBased ? set.target_seconds : null,
        weight_kg: set.target_weight_kg,
        rir: set.target_rir,
      });
    }

    setCompleted((prev) => {
      const next = new Set(prev);
      for (const set of remaining) {
        next.add(setKey(exercise.id, set.set_number));
      }
      return next;
    });

    if (exerciseIndex < exercises.length - 1) {
      setExerciseIndex((i) => i + 1);
      setSetIndex(0);
      return;
    }

    setFinishing(true);
    void showLocalNotification("¡Sesión completa!", {
      body: `${flow.name} · ${formatElapsed(elapsed)}`,
      tag: "gym-session-complete",
      url: "/gym",
    });
    setTimeout(() => void onComplete(), 1200);
  }

  function skipSet() {
    advanceWithoutRest();
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
        flowName={flow.name}
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

  return (
    <>
      <ActiveExerciseStage
        flow={flow}
        exercise={exercise}
        exerciseIndex={exerciseIndex}
        sets={sets}
        setIndex={setIndex}
        completedKeys={completed}
        elapsedLabel={formatElapsed(elapsed)}
        onExit={onExit}
        onOpenSwitcher={() => setShowSwitcher(true)}
        onUpdateSet={updateCurrentSet}
        onCompleteSet={() => void completeSet()}
        onCompleteExercise={() => void completeAllSetsForExercise()}
        onSkipSet={skipSet}
      />

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
            {exercise.exercise_catalog_id && (
              <button
                type="button"
                onClick={() => {
                  setShowSwitcher(false);
                  void openHistory();
                }}
                className="mt-4 w-full text-center text-xs text-accent-soft underline"
              >
                Ver historial del ejercicio
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowSwitcher(false);
                setEditSets(true);
              }}
              className="mt-2 w-full text-center text-xs text-muted underline"
            >
              Editar series de la sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
}
