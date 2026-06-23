import { habitPalette } from "@/styles/branding";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export const FOCUS_AREAS = [
  "Salud",
  "Fitness",
  "Productividad",
  "Mindfulness",
  "Lectura",
  "Sueño",
] as const;

export const HABIT_COLORS = [...habitPalette];

export const DAYS_SHORT = ["D", "L", "M", "X", "J", "V", "S"] as const;
export const DAYS_FULL = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;
