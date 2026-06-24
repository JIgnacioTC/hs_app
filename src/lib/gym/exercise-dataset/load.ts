import { readFileSync } from "node:fs";
import path from "node:path";
import type { DatasetExercise } from "@/lib/gym/exercise-dataset/types";

let cached: DatasetExercise[] | null = null;
let indexById: Map<string, DatasetExercise> | null = null;

export function loadExerciseDataset(): DatasetExercise[] {
  if (cached) return cached;

  const filePath = path.join(process.cwd(), "data/exercises-dataset/exercises.json");
  const raw = readFileSync(filePath, "utf8");
  cached = JSON.parse(raw) as DatasetExercise[];
  return cached;
}

function datasetIndex(): Map<string, DatasetExercise> {
  if (!indexById) {
    indexById = new Map(loadExerciseDataset().map((exercise) => [exercise.id, exercise]));
  }
  return indexById;
}

export function getDatasetExerciseById(id: string): DatasetExercise | undefined {
  return datasetIndex().get(id);
}
