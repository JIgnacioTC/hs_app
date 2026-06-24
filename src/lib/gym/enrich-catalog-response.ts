import { enrichExerciseCatalogMedia } from "@/lib/gym/exercise-dataset/catalog-import";
import { localizeCatalogExercise } from "@/lib/gym/exercise-dataset/localize-es";
import type { ExerciseCatalog } from "@/lib/types";

function applyCatalogPresentation<T extends ExerciseCatalog>(exercise: T): T {
  return localizeCatalogExercise(enrichExerciseCatalogMedia(exercise));
}

export function withExerciseMedia<T extends ExerciseCatalog>(exercise: T): T {
  return applyCatalogPresentation(exercise);
}

export function withExerciseMediaList<T extends ExerciseCatalog>(items: T[]): T[] {
  return items.map(applyCatalogPresentation);
}

export function withNestedExerciseMedia<
  T extends { exercise_catalog?: ExerciseCatalog | null },
>(row: T): T {
  if (!row.exercise_catalog) return row;
  return {
    ...row,
    exercise_catalog: applyCatalogPresentation(row.exercise_catalog),
  };
}

export function withFlowExerciseMedia<
  T extends { gym_exercises?: Array<{ exercise_catalog?: ExerciseCatalog | null }> },
>(flow: T): T {
  if (!flow.gym_exercises?.length) return flow;
  return {
    ...flow,
    gym_exercises: flow.gym_exercises.map(withNestedExerciseMedia),
  };
}
