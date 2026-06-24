import type { ExerciseCatalog } from "@/lib/types";

function muscleOverlap(a: string[] = [], b: string[] = []): number {
  const setA = new Set(a.map((m) => m.toLowerCase()));
  let hits = 0;
  for (const muscle of b) {
    if (setA.has(muscle.toLowerCase())) hits += 1;
  }
  return hits;
}

function equipmentOverlap(a: string[] = [], b: string[] = []): number {
  const setA = new Set(a);
  let hits = 0;
  for (const item of b) {
    if (setA.has(item)) hits += 1;
  }
  return hits;
}

/** Higher score = better alternative. Returns -1 for the same exercise. */
export function scoreExerciseAlternative(
  source: Pick<
    ExerciseCatalog,
    | "id"
    | "muscle_group"
    | "muscle_subgroup"
    | "exercise_type"
    | "execution_mode"
    | "equipment"
    | "target_muscles"
    | "secondary_muscles"
  >,
  candidate: Pick<
    ExerciseCatalog,
    | "id"
    | "muscle_group"
    | "muscle_subgroup"
    | "exercise_type"
    | "execution_mode"
    | "equipment"
    | "target_muscles"
    | "secondary_muscles"
  >
): number {
  if (source.id === candidate.id) return -1;

  let score = 0;

  if (
    source.muscle_subgroup &&
    candidate.muscle_subgroup.toLowerCase() === source.muscle_subgroup.toLowerCase()
  ) {
    score += 100;
  }

  if (candidate.muscle_group === source.muscle_group) score += 45;

  score += muscleOverlap(source.target_muscles, candidate.target_muscles) * 22;
  score += muscleOverlap(source.secondary_muscles, candidate.secondary_muscles) * 8;
  score += muscleOverlap(source.target_muscles, candidate.secondary_muscles) * 6;

  if (candidate.exercise_type === source.exercise_type) score += 18;
  if (candidate.execution_mode === source.execution_mode) score += 12;
  score += equipmentOverlap(source.equipment, candidate.equipment) * 6;

  return score;
}

export function rankExerciseAlternatives<
  T extends ExerciseCatalog & { activity_count?: number },
>(source: T, pool: T[], limit = 8): T[] {
  const scored = pool
    .map((candidate) => ({
      candidate,
      score:
        scoreExerciseAlternative(source, candidate) +
        Math.min(candidate.activity_count ?? 0, 20) * 0.5,
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name, "es"));

  return scored.slice(0, limit).map((row) => row.candidate);
}

export function alternativeMatchReason(
  source: Pick<ExerciseCatalog, "muscle_subgroup" | "muscle_group" | "exercise_type">,
  candidate: Pick<ExerciseCatalog, "muscle_subgroup" | "muscle_group" | "exercise_type">
): string {
  if (
    source.muscle_subgroup &&
    candidate.muscle_subgroup.toLowerCase() === source.muscle_subgroup.toLowerCase()
  ) {
    return candidate.muscle_subgroup;
  }
  if (candidate.muscle_group === source.muscle_group) {
    return candidate.muscle_group;
  }
  return candidate.muscle_subgroup || candidate.muscle_group;
}
