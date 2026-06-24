export const SEX_OPTIONS = [
  { id: "male", label: "Hombre" },
  { id: "female", label: "Mujer" },
  { id: "other", label: "Otro" },
  { id: "prefer_not_to_say", label: "Prefiero no decir" },
] as const;

export const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentario", hint: "Poco movimiento diario" },
  { id: "light", label: "Ligero", hint: "Caminatas o actividad ocasional" },
  { id: "moderate", label: "Moderado", hint: "Entreno 2–3 días/semana" },
  { id: "active", label: "Activo", hint: "Entreno 4–5 días/semana" },
  { id: "very_active", label: "Muy activo", hint: "Entreno casi a diario" },
] as const;

export const TRAINING_EXPERIENCE = [
  { id: "beginner", label: "Principiante", hint: "Menos de 6 meses" },
  { id: "intermediate", label: "Intermedio", hint: "6 meses – 2 años" },
  { id: "advanced", label: "Avanzado", hint: "Más de 2 años" },
] as const;

export type SexId = (typeof SEX_OPTIONS)[number]["id"];
export type ActivityLevelId = (typeof ACTIVITY_LEVELS)[number]["id"];
export type TrainingExperienceId = (typeof TRAINING_EXPERIENCE)[number]["id"];

export interface UserFitnessProfile {
  user_id: string;
  sex: SexId | null;
  birth_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevelId | null;
  training_experience: TrainingExperienceId | null;
  created_at?: string;
  updated_at?: string;
}

export interface FitnessProfileInput {
  sex?: SexId | null;
  birth_date?: string | null;
  age_years?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  activity_level?: ActivityLevelId | null;
  training_experience?: TrainingExperienceId | null;
}

export interface FitnessInsights {
  age: number | null;
  bmi: number | null;
  bmi_label: string | null;
  bmr_kcal: number | null;
  tdee_kcal: number | null;
  conditioning_label: string;
  training_hints: string[];
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevelId, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function ageFromBirthDate(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const born = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(born.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const monthDiff = today.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) {
    age -= 1;
  }
  return age >= 0 && age <= 120 ? age : null;
}

export function birthDateFromAge(ageYears: number): string {
  const safeAge = Math.min(Math.max(Math.round(ageYears), 10), 100);
  const year = new Date().getFullYear() - safeAge;
  return `${year}-06-15`;
}

export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return "Bajo peso";
  if (bmi < 25) return "Peso saludable";
  if (bmi < 30) return "Sobrepeso";
  return "Obesidad";
}

export function estimateBmr(
  profile: Pick<UserFitnessProfile, "sex" | "birth_date" | "height_cm" | "weight_kg">
): number | null {
  const { sex, height_cm, weight_kg } = profile;
  const age = ageFromBirthDate(profile.birth_date);
  if (!sex || sex === "prefer_not_to_say" || sex === "other") return null;
  if (age == null || height_cm == null || weight_kg == null) return null;

  const base =
    sex === "male"
      ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
      : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;

  return Math.round(base);
}

export function estimateTdee(
  profile: Pick<UserFitnessProfile, "sex" | "birth_date" | "height_cm" | "weight_kg" | "activity_level">
): number | null {
  const bmr = estimateBmr(profile);
  if (bmr == null || !profile.activity_level) return null;
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activity_level]);
}

export function buildFitnessInsights(profile: UserFitnessProfile | null): FitnessInsights {
  if (!profile?.height_cm || !profile.weight_kg) {
    return {
      age: ageFromBirthDate(profile?.birth_date),
      bmi: null,
      bmi_label: null,
      bmr_kcal: null,
      tdee_kcal: null,
      conditioning_label: "Completa tu perfil físico",
      training_hints: ["Añade altura y peso para estimar tu condición y personalizar recomendaciones."],
    };
  }

  const age = ageFromBirthDate(profile.birth_date);
  const bmi = calculateBmi(profile.weight_kg, profile.height_cm);
  const bmi_label = bmiLabel(bmi);
  const bmr_kcal = estimateBmr(profile);
  const tdee_kcal = estimateTdee(profile);

  const hints: string[] = [];

  if (bmi < 18.5) {
    hints.push("Prioriza fuerza y volumen moderado para ganar masa de forma saludable.");
  } else if (bmi >= 25) {
    hints.push("Combina fuerza con trabajo cardiovascular para mejorar composición corporal.");
  } else {
    hints.push("Tu IMC está en rango saludable: enfócate en progresión según tu objetivo.");
  }

  if (profile.training_experience === "beginner") {
    hints.push("Como principiante, prioriza técnica, movimientos compuestos y progresión gradual.");
  } else if (profile.training_experience === "advanced") {
    hints.push("Puedes tolerar más volumen: variaciones y periodización te convienen.");
  }

  if (profile.activity_level === "sedentary" || profile.activity_level === "light") {
    hints.push("Aumenta la frecuencia poco a poco: 2–3 sesiones full body son un buen inicio.");
  } else if (profile.activity_level === "very_active") {
    hints.push("Cuida la recuperación: alterna grupos musculares y controla el RIR.");
  }

  if (age != null && age >= 50) {
    hints.push("Incluye movilidad y trabajo de estabilidad junto a la fuerza.");
  }

  let conditioning_label = "Condición equilibrada";
  if (bmi < 18.5) conditioning_label = "Enfoque en ganancia controlada";
  else if (bmi >= 30) conditioning_label = "Enfoque en salud metabólica";
  else if (bmi >= 25) conditioning_label = "Enfoque en recomposición";

  return {
    age,
    bmi,
    bmi_label,
    bmr_kcal,
    tdee_kcal,
    conditioning_label,
    training_hints: hints.slice(0, 3),
  };
}

export function normalizeFitnessInput(input: FitnessProfileInput): Partial<UserFitnessProfile> {
  const patch: Partial<UserFitnessProfile> = {};

  if (input.sex !== undefined) patch.sex = input.sex;
  if (input.activity_level !== undefined) patch.activity_level = input.activity_level;
  if (input.training_experience !== undefined) patch.training_experience = input.training_experience;

  if (input.birth_date !== undefined) {
    patch.birth_date = input.birth_date;
  } else if (input.age_years != null && Number.isFinite(input.age_years)) {
    patch.birth_date = birthDateFromAge(input.age_years);
  }

  if (input.height_cm != null && Number.isFinite(input.height_cm)) {
    patch.height_cm = Math.round(input.height_cm * 10) / 10;
  }

  if (input.weight_kg != null && Number.isFinite(input.weight_kg)) {
    patch.weight_kg = Math.round(input.weight_kg * 10) / 10;
  }

  return patch;
}

export function isFitnessProfileComplete(
  profile: UserFitnessProfile | null | undefined
): boolean {
  if (!profile) return false;
  return Boolean(
    profile.sex &&
      profile.birth_date &&
      profile.height_cm &&
      profile.weight_kg &&
      profile.activity_level &&
      profile.training_experience
  );
}
