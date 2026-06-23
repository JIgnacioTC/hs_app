import { readFileSync } from "node:fs";
import path from "node:path";
import type { DatasetExercise } from "@/lib/gym/exercise-dataset/types";

let cached: DatasetExercise[] | null = null;

export function loadExerciseDataset(): DatasetExercise[] {
  if (cached) return cached;

  const filePath = path.join(process.cwd(), "data/exercises-dataset/exercises.json");
  const raw = readFileSync(filePath, "utf8");
  cached = JSON.parse(raw) as DatasetExercise[];
  return cached;
}

export function getDatasetExerciseById(id: string): DatasetExercise | undefined {
  return loadExerciseDataset().find((e) => e.id === id);
}
