import { loadExerciseDataset, getDatasetExerciseById } from "@/lib/gym/exercise-dataset/load";
import { datasetMediaUrl } from "@/lib/gym/exercise-dataset/media";
import {
  mapMuscleGroupToBodyPart,
  normalizeDatasetExercise,
} from "@/lib/gym/exercise-dataset/normalize";
import type { DatasetExercise, NormalizedDatasetExercise } from "@/lib/gym/exercise-dataset/types";

export const IMPORT_BATCH_SIZE = 25;

export interface CatalogImportHint {
  exactId?: string;
  searchTerms?: string[];
  bodyPart?: string;
}

/** Known mappings from curated Spanish slugs to dataset entries. */
export const CATALOG_DATASET_HINTS: Record<string, CatalogImportHint> = {
  "press-banca-plano": { searchTerms: ["barbell bench press", "bench press"], bodyPart: "chest" },
  "press-banca-inclinado": { searchTerms: ["incline dumbbell press"], bodyPart: "chest" },
  "press-banca-declinado": { searchTerms: ["decline bench press"], bodyPart: "chest" },
  "aperturas-mancuernas": { searchTerms: ["dumbbell fly"], bodyPart: "chest" },
  "cruces-polea-alta": { searchTerms: ["cable cross-over"], bodyPart: "chest" },
  "cruces-polea-baja": { searchTerms: ["cable cross-over"], bodyPart: "chest" },
  "fondos-paralelas": { searchTerms: ["chest dip"], bodyPart: "chest" },
  flexiones: { searchTerms: ["push-up", "push up"], bodyPart: "chest" },
  dominadas: { searchTerms: ["pull-up", "pull up"], bodyPart: "back" },
  "jalon-pecho": { searchTerms: ["lat pulldown"], bodyPart: "back" },
  "remo-barra": { searchTerms: ["barbell bent over row"], bodyPart: "back" },
  "remo-mancuerna-unilateral": { searchTerms: ["dumbbell one arm row"], bodyPart: "back" },
  "remo-polea-baja": { searchTerms: ["seated cable row"], bodyPart: "back" },
  "pullover-polea": { searchTerms: ["cable pullover"], bodyPart: "back" },
  "face-pull": { searchTerms: ["face pull"], bodyPart: "back" },
  "peso-muerto-rumano": { searchTerms: ["barbell romanian deadlift"], bodyPart: "upper legs" },
  "press-militar": { searchTerms: ["barbell military press"], bodyPart: "shoulders" },
  "press-hombro-mancuernas": { searchTerms: ["dumbbell shoulder press"], bodyPart: "shoulders" },
  "elevaciones-laterales": { searchTerms: ["dumbbell lateral raise"], bodyPart: "shoulders" },
  "elevaciones-frontales": { searchTerms: ["dumbbell front raise"], bodyPart: "shoulders" },
  pajaros: { searchTerms: ["dumbbell rear fly"], bodyPart: "shoulders" },
  "remo-al-cuello": { searchTerms: ["barbell upright row"], bodyPart: "shoulders" },
  "curl-barra": { searchTerms: ["barbell curl"], bodyPart: "upper arms" },
  "curl-martillo": { searchTerms: ["dumbbell hammer curl"], bodyPart: "upper arms" },
  "curl-concentrado": { searchTerms: ["dumbbell concentration curl"], bodyPart: "upper arms" },
  "extension-triceps-cuerda": { searchTerms: ["triceps pushdown"], bodyPart: "upper arms" },
  "fondos-banco": { searchTerms: ["triceps dip"], bodyPart: "upper arms" },
  "press-frances": { searchTerms: ["barbell lying triceps extension"], bodyPart: "upper arms" },
  "sentadilla-barra": { searchTerms: ["barbell full squat"], bodyPart: "upper legs" },
  "sentadilla-frontal": { searchTerms: ["barbell front squat"], bodyPart: "upper legs" },
  prensa: { searchTerms: ["sled 45 leg press"], bodyPart: "upper legs" },
  "extension-cuadriceps": { searchTerms: ["lever leg extension"], bodyPart: "upper legs" },
  "zancadas-caminando": { searchTerms: ["dumbbell lunge"], bodyPart: "upper legs" },
  "zancadas-bulgarias": { searchTerms: ["bulgarian split squat"], bodyPart: "upper legs" },
  "peso-muerto-convencional": { searchTerms: ["barbell deadlift"], bodyPart: "upper legs" },
  "hip-thrust": { searchTerms: ["barbell hip thrust"], bodyPart: "upper legs" },
  "curl-femoral-tumbado": { searchTerms: ["lying leg curl"], bodyPart: "upper legs" },
  "curl-femoral-sentado": { searchTerms: ["seated leg curl"], bodyPart: "upper legs" },
  "elevacion-gemelos-pie": { searchTerms: ["standing calf raise"], bodyPart: "lower legs" },
  "sentadilla-sumo": { searchTerms: ["sumo squat"], bodyPart: "upper legs" },
  plancha: { searchTerms: ["front plank", "plank"], bodyPart: "waist" },
  "plancha-lateral": { searchTerms: ["side plank"], bodyPart: "waist" },
  "crunch-banco": { searchTerms: ["decline crunch"], bodyPart: "waist" },
  "elevacion-piernas": { searchTerms: ["hanging leg raise"], bodyPart: "waist" },
  "rueda-abdominal": { searchTerms: ["wheel rollerout"], bodyPart: "waist" },
  "pallof-press": { searchTerms: ["pallof press"], bodyPart: "waist" },
  burpees: { searchTerms: ["burpee"], bodyPart: "cardio" },
  "salto-cuerda": { searchTerms: ["jump rope"], bodyPart: "cardio" },
};

export interface CatalogMediaPayload {
  dataset_id: string;
  demo_gif_url: string | null;
  image_url: string | null;
  body_parts: string[];
  target_muscles: string[];
  secondary_muscles: string[];
}

export function toCatalogMediaPayload(exercise: NormalizedDatasetExercise): CatalogMediaPayload {
  return {
    dataset_id: exercise.dataset_id,
    demo_gif_url: exercise.demo_gif_url || null,
    image_url: exercise.image_url || null,
    body_parts: exercise.body_parts,
    target_muscles: exercise.target_muscles,
    secondary_muscles: exercise.secondary_muscles,
  };
}

export function toCatalogRow(exercise: NormalizedDatasetExercise) {
  return {
    slug: exercise.slug,
    name: exercise.name,
    muscle_group: exercise.muscle_group,
    muscle_subgroup: exercise.muscle_subgroup,
    exercise_type: exercise.exercise_type,
    execution_mode: exercise.execution_mode,
    default_prescription: exercise.default_prescription,
    equipment: exercise.equipment,
    rest_type: exercise.rest_type,
    rest_seconds: exercise.rest_seconds,
    instructions: exercise.instructions,
    dataset_id: exercise.dataset_id,
    demo_gif_url: exercise.demo_gif_url || null,
    image_url: exercise.image_url || null,
    body_parts: exercise.body_parts,
    target_muscles: exercise.target_muscles,
    secondary_muscles: exercise.secondary_muscles,
    active: true,
  };
}

function normalizeSearch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreMatch(name: string, terms: string[]): number {
  const normalized = normalizeSearch(name);
  let best = 0;
  for (const term of terms) {
    const t = normalizeSearch(term);
    if (normalized === t) best = Math.max(best, 100);
    else if (normalized.includes(t)) best = Math.max(best, 80 - (normalized.length - t.length));
    else {
      const words = t.split(" ");
      const hits = words.filter((w) => normalized.includes(w)).length;
      if (hits > 0) best = Math.max(best, (hits / words.length) * 60);
    }
  }
  return best;
}

export function buildDatasetIndex(): Map<string, NormalizedDatasetExercise> {
  const index = new Map<string, NormalizedDatasetExercise>();
  for (const raw of loadExerciseDataset()) {
    index.set(raw.id, normalizeDatasetExercise(raw));
  }
  return index;
}

export function findDatasetMatch(
  searchTerms: string[],
  bodyPart?: string,
  pool?: NormalizedDatasetExercise[]
): NormalizedDatasetExercise | null {
  const exercises = pool ?? [...buildDatasetIndex().values()];
  const filtered = bodyPart
    ? exercises.filter((e) => e.body_parts.some((p) => p === bodyPart.toLowerCase()))
    : exercises;

  let best: NormalizedDatasetExercise | null = null;
  let bestScore = 0;

  for (const exercise of filtered) {
    const score = scoreMatch(exercise.name, searchTerms);
    if (score > bestScore) {
      bestScore = score;
      best = exercise;
    }
  }

  return bestScore >= 50 ? best : null;
}

export function resolveCatalogExercise(
  slug: string,
  muscleGroup?: string,
  index?: Map<string, NormalizedDatasetExercise>
): NormalizedDatasetExercise | null {
  const hint = CATALOG_DATASET_HINTS[slug];
  const datasetIndex = index ?? buildDatasetIndex();

  if (hint?.exactId) {
    return datasetIndex.get(hint.exactId) ?? null;
  }

  const bodyPart =
    hint?.bodyPart ?? (muscleGroup ? mapMuscleGroupToBodyPart(muscleGroup) ?? undefined : undefined);
  const searchTerms = hint?.searchTerms ?? [slug.replace(/-/g, " ")];
  const pool = bodyPart
    ? [...datasetIndex.values()].filter((e) =>
        e.body_parts.some((p) => p === bodyPart.toLowerCase())
      )
    : [...datasetIndex.values()];

  return findDatasetMatch(searchTerms, bodyPart, pool);
}

export function buildMuscleGroupMediaFromDataset(): Record<string, string> {
  const media: Record<string, string> = {};
  const groups = ["Pecho", "Espalda", "Hombros", "Brazos", "Piernas", "Core", "Cardio", "Movilidad"];

  for (const group of groups) {
    const bodyPart = mapMuscleGroupToBodyPart(group);
    if (!bodyPart) continue;
    const match = findDatasetMatch([bodyPart], bodyPart);
    const url = match?.demo_gif_url ?? match?.image_url;
    if (url) media[group] = url;
  }

  return media;
}

export function getNormalizedDatasetBatch(offset: number, limit: number): NormalizedDatasetExercise[] {
  const all = loadExerciseDataset().map(normalizeDatasetExercise);
  return all.slice(offset, offset + limit);
}

export function getDatasetTotal(): number {
  return loadExerciseDataset().length;
}

export function getDatasetExerciseRaw(id: string) {
  return getDatasetExerciseById(id);
}

export function enrichExerciseCatalogMedia<
  T extends {
    dataset_id?: string | null;
    demo_gif_url?: string | null;
    image_url?: string | null;
  },
>(exercise: T): T {
  if (!exercise.dataset_id) return exercise;

  const raw = getDatasetExerciseById(exercise.dataset_id);
  if (!raw) return exercise;

  const demo = datasetMediaUrl(raw.gif_url);
  const image = datasetMediaUrl(raw.image);

  if (!demo && !image) return exercise;

  return {
    ...exercise,
    demo_gif_url: demo ?? exercise.demo_gif_url,
    image_url: image ?? exercise.image_url,
  };
}

export function mediaPayloadFromDatasetId(datasetId: string): CatalogMediaPayload | null {
  const raw = getDatasetExerciseById(datasetId);
  if (!raw) return null;
  return toCatalogMediaPayload(normalizeDatasetExercise(raw));
}
