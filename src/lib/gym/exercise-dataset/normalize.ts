import { datasetMediaUrl } from "@/lib/gym/exercise-dataset/media";
import type { DatasetExercise, NormalizedDatasetExercise } from "@/lib/gym/exercise-dataset/types";

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

function slugify(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "exercise"}-${id}`;
}

function mapEquipment(raw: string): string[] {
  if (!raw?.trim()) return [];
  return [raw.toLowerCase().replace(/\s+/g, "_")];
}

function inferExerciseType(category: string, name: string): string {
  const cat = category.toLowerCase();
  const lower = name.toLowerCase();
  if (cat === "cardio") return "cardio";
  if (/stretch|mobility|rotation|foam|cat-cow/i.test(lower)) return "movilidad";
  if (/jump|burpee|plyo|box jump/i.test(lower)) return "pliometrico";
  if (/curl|raise|extension|fly|kickback|crunch|plank|hold/i.test(lower)) return "aislamiento";
  return "compuesto";
}

function inferExecutionMode(name: string, category: string): string {
  const lower = name.toLowerCase();
  if (category === "cardio" && /run|bike|row|elliptical|step|rope/i.test(lower)) return "tiempo";
  if (/plank|hold|isometric|wall sit/i.test(lower)) return "isometrico";
  if (/lunge|one arm|unilateral|single arm|alternating|each side/i.test(lower)) {
    return "repeticiones_por_lado";
  }
  return "repeticiones";
}

function inferRest(category: string, exerciseType: string): { rest_type: string; rest_seconds: number } {
  if (category === "cardio" || exerciseType === "movilidad") {
    return { rest_type: "ninguno", rest_seconds: 0 };
  }
  if (exerciseType === "aislamiento") {
    return { rest_type: "corto", rest_seconds: 60 };
  }
  if (exerciseType === "compuesto") {
    return { rest_type: "medio", rest_seconds: 90 };
  }
  return { rest_type: "medio", rest_seconds: 60 };
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeDatasetExercise(raw: DatasetExercise): NormalizedDatasetExercise {
  const muscleGroup = mapBodyPartToMuscleGroup(raw.body_part || raw.category);
  const muscleSubgroup = titleCase(raw.target || raw.muscle_group || raw.body_part);
  const exerciseType = inferExerciseType(raw.category, raw.name);
  const executionMode = inferExecutionMode(raw.name, raw.category);
  const { rest_type, rest_seconds } = inferRest(raw.category, exerciseType);

  const steps = raw.instruction_steps?.en;
  const instructions =
    steps?.length
      ? steps.join(" ")
      : raw.instructions?.en?.trim() ?? "";

  const bodyPart = (raw.body_part || raw.category).toLowerCase();
  const target = raw.target?.toLowerCase() ?? raw.muscle_group?.toLowerCase() ?? "";
  const secondary = (raw.secondary_muscles ?? []).map((m) => m.toLowerCase());

  return {
    dataset_id: raw.id,
    name: raw.name.trim(),
    slug: slugify(raw.name, raw.id),
    muscle_group: muscleGroup,
    muscle_subgroup: muscleSubgroup,
    exercise_type: exerciseType,
    execution_mode: executionMode,
    default_prescription: exerciseType === "cardio" ? "15-20 min" : "3×10-12",
    equipment: mapEquipment(raw.equipment),
    rest_type,
    rest_seconds,
    instructions,
    demo_gif_url: datasetMediaUrl(raw.gif_url) ?? "",
    image_url: datasetMediaUrl(raw.image) ?? "",
    body_parts: bodyPart ? [bodyPart] : [],
    target_muscles: target ? [target] : [],
    secondary_muscles: secondary,
  };
}
