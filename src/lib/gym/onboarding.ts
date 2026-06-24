export const TRAINING_GOALS = [
  {
    id: "fuerza",
    label: "Fuerza",
    hint: "Levantar más peso con técnica sólida",
    emoji: "⚡",
  },
  {
    id: "hipertrofia",
    label: "Hipertrofia",
    hint: "Masa muscular y volumen de trabajo",
    emoji: "💪",
  },
  {
    id: "resistencia",
    label: "Resistencia",
    hint: "Más series, menos pausa, mejor condición",
    emoji: "🔥",
  },
  {
    id: "general",
    label: "Forma general",
    hint: "Moverte bien y mantener constancia",
    emoji: "✦",
  },
] as const;

export type TrainingGoalId = (typeof TRAINING_GOALS)[number]["id"];

export const TRAINING_FREQUENCY = [
  { id: "2-3", label: "2–3 días", hint: "Ideal para empezar" },
  { id: "4", label: "4 días", hint: "Ritmo equilibrado" },
  { id: "5-6", label: "5–6 días", hint: "Alta frecuencia" },
] as const;

export type TrainingFrequencyId = (typeof TRAINING_FREQUENCY)[number]["id"];

export const STARTER_PLANS: Record<
  TrainingGoalId,
  { name: string; mood: string; muscles: string[] }
> = {
  fuerza: {
    name: "Base de fuerza",
    mood: "forge",
    muscles: ["Piernas", "Pecho", "Espalda", "Hombros"],
  },
  hipertrofia: {
    name: "Full body volumen",
    mood: "pulse",
    muscles: ["Piernas", "Pecho", "Espalda", "Brazos"],
  },
  resistencia: {
    name: "Circuito activo",
    mood: "pulse",
    muscles: ["Piernas", "Core", "Hombros", "Glúteos"],
  },
  general: {
    name: "Cuerpo completo",
    mood: "dawn",
    muscles: ["Piernas", "Pecho", "Espalda", "Core"],
  },
};
