import { stepsOf, type Flow } from "@/lib/gym/flow";
import type { PlannedSet, SetLog } from "@/lib/gym/sets";
import type { GymSession } from "@/lib/types";

export function setKey(exerciseId: string, setNumber: number) {
  return `${exerciseId}-${setNumber}`;
}

export function sessionDetailToFlow(session: GymSession & { gym_routines?: Flow }): Flow {
  const routine = session.gym_routines;
  if (!routine) throw new Error("Sesión sin rutina");

  return {
    ...routine,
    gym_exercises: (routine.gym_exercises ?? [])
      .map((ex) => ({
        ...ex,
        gym_planned_sets: (ex.gym_planned_sets ?? []).sort(
          (a, b) => a.set_number - b.set_number
        ),
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
  };
}

export function completedSetKeys(logs: SetLog[]): Set<string> {
  const keys = new Set<string>();
  for (const log of logs) {
    if (!log.gym_exercise_id || log.skipped) continue;
    keys.add(setKey(log.gym_exercise_id, log.set_number));
  }
  return keys;
}

export function resumePosition(
  flow: Flow,
  logs: SetLog[]
): { exerciseIndex: number; setIndex: number; allComplete: boolean } {
  const exercises = stepsOf(flow);
  const completed = completedSetKeys(logs);

  for (let ei = 0; ei < exercises.length; ei++) {
    const ex = exercises[ei];
    const sets = (ex.gym_planned_sets ?? []).sort((a, b) => a.set_number - b.set_number);
    for (let si = 0; si < sets.length; si++) {
      if (!completed.has(setKey(ex.id, sets[si].set_number))) {
        return { exerciseIndex: ei, setIndex: si, allComplete: false };
      }
    }
  }

  const lastEx = Math.max(0, exercises.length - 1);
  const lastSets = exercises[lastEx]?.gym_planned_sets ?? [];
  return {
    exerciseIndex: lastEx,
    setIndex: Math.max(0, lastSets.length - 1),
    allComplete: exercises.length > 0 && completed.size > 0,
  };
}

export function applyLogsToPlannedMap(
  flow: Flow,
  logs: SetLog[]
): Record<string, PlannedSet[]> {
  const map: Record<string, PlannedSet[]> = {};
  const logByKey = new Map<string, SetLog>();
  for (const log of logs) {
    if (!log.gym_exercise_id || log.skipped) continue;
    logByKey.set(setKey(log.gym_exercise_id, log.set_number), log);
  }

  for (const ex of stepsOf(flow)) {
    map[ex.id] = (ex.gym_planned_sets ?? [])
      .sort((a, b) => a.set_number - b.set_number)
      .map((planned) => {
        const log = logByKey.get(setKey(ex.id, planned.set_number));
        if (!log) return planned;
        return {
          ...planned,
          target_reps: log.reps ?? planned.target_reps,
          target_seconds: log.duration_seconds ?? planned.target_seconds,
          target_weight_kg: log.weight_kg ?? planned.target_weight_kg,
          target_rir: log.rir ?? planned.target_rir,
        };
      });
  }

  return map;
}
