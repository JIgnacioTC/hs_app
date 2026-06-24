import type { ExerciseCatalog } from "@/lib/types";

export interface PlannedSet {
  id?: string;
  gym_exercise_id?: string;
  set_number: number;
  target_reps: number | null;
  target_seconds: number | null;
  target_weight_kg: number | null;
  target_rir: number | null;
  rest_seconds: number;
}

export interface SetLog {
  id: string;
  session_id: string;
  user_id: string;
  gym_exercise_id: string | null;
  exercise_catalog_id: string | null;
  set_number: number;
  reps: number | null;
  duration_seconds: number | null;
  weight_kg: number | null;
  rir: number | null;
  rest_seconds_used: number | null;
  skipped?: boolean;
  completed_at: string;
}

export function isTimeBased(mode?: string) {
  return mode === "tiempo" || mode === "isometrico";
}

export function parsePrescription(prescription: string): { sets: number; reps?: number; seconds?: number } {
  const setsMatch = prescription.match(/^(\d+)\s*[×x]/i);
  const sets = setsMatch ? parseInt(setsMatch[1], 10) : 3;

  const secMatch = prescription.match(/(\d+)\s*s/i);
  if (secMatch) {
    return { sets, seconds: parseInt(secMatch[1], 10) };
  }

  const repMatch = prescription.match(/[×x]\s*(\d+)/i) || prescription.match(/(\d+)\s*[-–]?\s*(\d+)?/);
  if (repMatch) {
    const reps = parseInt(repMatch[repMatch.length - 1] || repMatch[1], 10);
    return { sets, reps: Number.isFinite(reps) ? reps : 10 };
  }

  return { sets, reps: 10 };
}

export function defaultPlannedSets(catalog: ExerciseCatalog, restSeconds?: number): PlannedSet[] {
  const parsed = parsePrescription(catalog.default_prescription);
  const time = isTimeBased(catalog.execution_mode);
  const count = Math.min(Math.max(parsed.sets, 1), 8);
  const rest = restSeconds ?? catalog.rest_seconds ?? 60;

  return Array.from({ length: count }, (_, i) => ({
    set_number: i + 1,
    target_reps: time ? null : (parsed.reps ?? 10),
    target_seconds: time ? (parsed.seconds ?? 45) : null,
    target_weight_kg: null,
    target_rir: time ? null : 2,
    rest_seconds: rest,
  }));
}

export function formatSetTarget(set: PlannedSet, timeBased: boolean) {
  if (timeBased && set.target_seconds) return `${set.target_seconds}s`;
  const parts = [];
  if (set.target_reps) parts.push(`${set.target_reps} rep`);
  if (set.target_weight_kg) parts.push(`${set.target_weight_kg} kg`);
  if (set.target_rir != null) parts.push(`RIR ${set.target_rir}`);
  return parts.join(" · ") || "—";
}

export interface HistoryPoint {
  date: string;
  max_weight: number | null;
  total_reps: number | null;
  avg_rir: number | null;
  sets: number;
}

export interface ExerciseHistory {
  catalog_id: string;
  exercise_name: string;
  points: HistoryPoint[];
  personal_record: { weight_kg: number | null; reps: number | null; date: string; volume?: number } | null;
  last_set: {
    reps: number | null;
    weight_kg: number | null;
    duration_seconds: number | null;
    rir: number | null;
  } | null;
  total_sessions: number;
}
