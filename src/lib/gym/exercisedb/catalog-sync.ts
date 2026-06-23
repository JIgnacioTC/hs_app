import {
  fetchAllExerciseDbExercises,
  findExerciseDbMatch,
  getExerciseDbExercise,
  listExerciseDbExercises,
} from "@/lib/gym/exercisedb/client";
import { mapMuscleGroupToBodyPart } from "@/lib/gym/exercisedb/normalize";
import type { NormalizedExerciseDbExercise } from "@/lib/gym/exercisedb/types";

export interface CatalogSyncHint {
  exactId?: string;
  searchTerms?: string[];
  bodyPart?: string;
}

/** Known mappings from our curated slugs to ExerciseDB entries. */
export const CATALOG_EXERCISEDB_HINTS: Record<string, CatalogSyncHint> = {
  "press-banca-plano": { exactId: "EIeI8Vf" },
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

export interface CatalogEnrichmentPayload {
  exercisedb_id: string | null;
  demo_gif_url: string | null;
  image_url: string | null;
  image_urls: Record<string, string> | null;
  video_url: string | null;
  body_parts: string[];
  target_muscles: string[];
  secondary_muscles: string[];
  overview: string | null;
  exercise_tips: string[];
  variations: string[];
}

export function toCatalogEnrichment(
  exercise: NormalizedExerciseDbExercise
): CatalogEnrichmentPayload {
  return {
    exercisedb_id: exercise.exercisedb_id,
    demo_gif_url: exercise.demo_media_url,
    image_url: exercise.image_url,
    image_urls: exercise.image_urls as Record<string, string> | null,
    video_url: exercise.video_url,
    body_parts: exercise.body_parts,
    target_muscles: exercise.target_muscles,
    secondary_muscles: exercise.secondary_muscles,
    overview: exercise.overview,
    exercise_tips: exercise.exercise_tips,
    variations: exercise.variations,
  };
}

export async function resolveCatalogExercise(
  slug: string,
  muscleGroup?: string,
  cache?: NormalizedExerciseDbExercise[]
): Promise<NormalizedExerciseDbExercise | null> {
  const hint = CATALOG_EXERCISEDB_HINTS[slug];
  if (hint?.exactId) {
    const cached = cache?.find((e) => e.exercisedb_id === hint.exactId);
    if (cached) return cached;
    return getExerciseDbExercise(hint.exactId);
  }

  const bodyPart =
    hint?.bodyPart ?? (muscleGroup ? mapMuscleGroupToBodyPart(muscleGroup) ?? undefined : undefined);
  const searchTerms = hint?.searchTerms ?? [slug.replace(/-/g, " ")];

  const pool = cache && bodyPart
    ? cache.filter((e) => e.body_parts.some((part) => part.toLowerCase() === bodyPart))
    : cache;

  return findExerciseDbMatch(searchTerms, bodyPart, pool);
}

export async function loadExerciseDbCache(): Promise<NormalizedExerciseDbExercise[]> {
  return fetchAllExerciseDbExercises();
}

export async function buildMuscleGroupMediaMap(): Promise<Record<string, string>> {
  const groups = ["Pecho", "Espalda", "Hombros", "Brazos", "Piernas", "Core", "Cardio", "Movilidad"];
  const media: Record<string, string> = {};

  for (const group of groups) {
    const bodyPart = mapMuscleGroupToBodyPart(group);
    if (!bodyPart) continue;
    try {
      const { exercises } = await listExerciseDbExercises({ bodyParts: bodyPart, limit: 1 });
      const url = exercises[0]?.demo_media_url ?? exercises[0]?.image_url;
      if (url) media[group] = url;
    } catch {
      // Skip groups that fail to load.
    }
  }

  return media;
}
