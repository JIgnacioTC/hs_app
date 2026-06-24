export const brand = {
  colors: {
    bg: {
      base: "#0C0C0E",
      elevated: "#141416",
      surface: "#1A1A1D",
      muted: "#222226",
    },
    text: {
      primary: "#F4F4F5",
      secondary: "#A0A0A8",
      muted: "#63636A",
      inverse: "#0C0C0E",
    },
    accent: {
      DEFAULT: "#E8E4DC",
      soft: "#B8B2A6",
      glow: "rgba(232, 228, 220, 0.12)",
    },
    semantic: {
      success: "#9CAF88",
      warning: "#C4A574",
      danger: "#B87A7A",
    },
    chart: {
      line: "#3ECFD9",
      grid: "rgba(255, 255, 255, 0.05)",
      surface: "#0A0A0C",
      fill: "rgba(62, 207, 217, 0.12)",
    },
    border: {
      subtle: "rgba(255, 255, 255, 0.06)",
      default: "rgba(255, 255, 255, 0.10)",
      strong: "rgba(232, 228, 220, 0.20)",
    },
  },
  radius: {
    sm: "12px",
    md: "16px",
    lg: "20px",
    xl: "28px",
    full: "9999px",
  },
  font: {
    sans: "var(--font-inter)",
    mono: "var(--font-geist-mono)",
  },
  motion: {
    fast: "150ms ease-out",
    base: "200ms ease-out",
    slow: "300ms ease-out",
  },
} as const;

/** Colores para las 4 leyes + identidad (Atomic Habits) */
export const habitLawColors = {
  identity: "#E8E4DC",
  obvious: "#8B9AAB",
  attractive: "#C4A574",
  easy: "#9CAF88",
  satisfying: "#B8B2A6",
} as const;

export const habitPalette = [
  habitLawColors.identity,
  habitLawColors.obvious,
  habitLawColors.attractive,
  habitLawColors.easy,
  habitLawColors.satisfying,
  "#A898B8",
] as const;

export const FOUR_LAWS = [
  { key: "obvious", label: "Obvio", field: "cue" as const, hint: "¿Qué disparará el hábito?" },
  { key: "attractive", label: "Atractivo", field: "craving" as const, hint: "¿Por qué lo deseas?" },
  { key: "easy", label: "Fácil", field: "two_minute_version" as const, hint: "Versión de 2 minutos" },
  { key: "satisfying", label: "Satisfactorio", field: "reward" as const, hint: "Recompensa inmediata" },
] as const;

export const IDENTITY_PREFIX = "Soy el tipo de persona que";
