import { format } from "date-fns";
import { habitPalette } from "@/styles/branding";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Fecha local YYYY-MM-DD (no UTC). */
export function localDateKey(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "yyyy-MM-dd");
}

export function todayISO() {
  return localDateKey(new Date());
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
