import type { GymExercise, GymRoutine, ExerciseCatalog } from "@/lib/types";
import { defaultPlannedSets, type PlannedSet } from "@/lib/gym/sets";

export type FlowStep = GymExercise;
export type Flow = GymRoutine;

export interface FlowDraftStep {
  id: string;
  catalogId: string;
  name: string;
  prescription: string;
  breath: number;
  muscleGroup: string;
  catalog?: ExerciseCatalog;
  planned_sets: PlannedSet[];
}

export function stepsOf(flow: Flow): FlowStep[] {
  return (flow.gym_exercises ?? []).sort((a, b) => a.sort_order - b.sort_order);
}

export function stepLabel(step: FlowStep): string | null {
  const cat = step.exercise_catalog;
  if (cat?.default_prescription) return cat.default_prescription;
  if (step.reps && step.reps !== "10" && step.reps !== "—") return step.reps;
  if (step.weight) return step.weight;
  return null;
}

export function breathSeconds(step: FlowStep): number {
  if (step.exercise_catalog?.rest_seconds) return step.exercise_catalog.rest_seconds;
  return step.rest_seconds || 45;
}

export function catalogFromStep(step: FlowStep): ExerciseCatalog | null {
  return step.exercise_catalog ?? null;
}

export const FLOW_MOODS = [
  { id: "dawn", label: "Amanecer", hint: "Suave, despertar el cuerpo" },
  { id: "pulse", label: "Pulso", hint: "Ritmo constante, sin pausa" },
  { id: "forge", label: "Forja", hint: "Fuerza, intención" },
  { id: "drift", label: "Deriva", hint: "Recuperación, movilidad" },
] as const;

export function moodFromDescription(desc: string | null | undefined) {
  return FLOW_MOODS.find((m) => m.id === desc) ?? null;
}

export function draftFromCatalog(catalog: ExerciseCatalog, planned_sets?: PlannedSet[]): FlowDraftStep {
  const sets = planned_sets ?? defaultPlannedSets(catalog);
  return {
    id: crypto.randomUUID(),
    catalogId: catalog.id,
    name: catalog.name,
    prescription: catalog.default_prescription,
    breath: catalog.rest_seconds,
    muscleGroup: catalog.muscle_group,
    catalog,
    planned_sets: sets,
  };
}
