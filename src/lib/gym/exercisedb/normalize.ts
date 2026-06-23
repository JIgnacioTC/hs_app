import type {
  ExerciseDbRawExercise,
  NormalizedExerciseDbExercise,
} from "@/lib/gym/exercisedb/types";

function pickBestImageUrl(raw: ExerciseDbRawExercise): string | null {
  if (raw.imageUrls?.["720p"]) return raw.imageUrls["720p"];
  if (raw.imageUrls?.["480p"]) return raw.imageUrls["480p"];
  if (raw.imageUrl) return raw.imageUrl;
  if (raw.gifUrl) return raw.gifUrl;
  if (raw.imageUrls?.["360p"]) return raw.imageUrls["360p"];
  return null;
}

function normalizeInstructions(instructions?: string[] | string): string {
  if (!instructions) return "";
  if (Array.isArray(instructions)) {
    return instructions
      .map((step) => step.replace(/^Step:\d+\s*/i, "").trim())
      .filter(Boolean)
      .join(" ");
  }
  return instructions.trim();
}

export function normalizeExerciseDbExercise(
  raw: ExerciseDbRawExercise
): NormalizedExerciseDbExercise {
  const demoMediaUrl = raw.gifUrl ?? raw.imageUrl ?? pickBestImageUrl(raw) ?? null;
  const imageUrl = raw.imageUrl ?? raw.imageUrls?.["480p"] ?? raw.gifUrl ?? null;

  return {
    exercisedb_id: raw.exerciseId,
    name: raw.name.trim(),
    demo_media_url: demoMediaUrl,
    image_url: imageUrl,
    image_urls: raw.imageUrls ?? null,
    video_url: raw.videoUrl ?? null,
    body_parts: (raw.bodyParts ?? []).map((p) => p.toLowerCase()),
    target_muscles: (raw.targetMuscles ?? []).map((m) => m.toLowerCase()),
    secondary_muscles: (raw.secondaryMuscles ?? []).map((m) => m.toLowerCase()),
    equipments: (raw.equipments ?? []).map((e) => e.toLowerCase()),
    exercise_type: raw.exerciseType ?? null,
    instructions: normalizeInstructions(raw.instructions),
    overview: raw.overview ?? null,
    exercise_tips: raw.exerciseTips ?? [],
    variations: raw.variations ?? [],
    keywords: raw.keywords ?? [],
    related_exercise_ids: raw.relatedExerciseIds ?? [],
  };
}

/** Maps ExerciseDB body parts to the app's Spanish muscle groups. */
export function mapBodyPartToMuscleGroup(bodyPart: string): string {
  const key = bodyPart.toLowerCase().trim();
  const map: Record<string, string> = {
    chest: "Pecho",
    back: "Espalda",
    shoulders: "Hombros",
    "upper arms": "Brazos",
    "lower arms": "Brazos",
    "upper legs": "Piernas",
    "lower legs": "Piernas",
    waist: "Core",
    cardio: "Cardio",
    neck: "Movilidad",
  };
  return map[key] ?? bodyPart;
}

export function mapMuscleGroupToBodyPart(muscleGroup: string): string | null {
  const map: Record<string, string> = {
    Pecho: "chest",
    Espalda: "back",
    Hombros: "shoulders",
    Brazos: "upper arms",
    Piernas: "upper legs",
    Core: "waist",
    Cardio: "cardio",
    Movilidad: "waist",
  };
  return map[muscleGroup] ?? null;
}
