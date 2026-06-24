/** Traducción al español para ejercicios del dataset (inglés → ES). */

const MUSCLE_ES: Record<string, string> = {
  abs: "Abdominales",
  abdominals: "Abdominales",
  biceps: "Bíceps",
  triceps: "Tríceps",
  forearms: "Antebrazos",
  shoulders: "Hombros",
  deltoids: "Deltoides",
  delts: "Deltoides",
  chest: "Pecho",
  pectorals: "Pectorales",
  pecs: "Pectorales",
  lats: "Dorsales",
  "latissimus dorsi": "Dorsal ancho",
  back: "Espalda",
  traps: "Trapecio",
  trapezius: "Trapecio",
  rhomboids: "Romboides",
  glutes: "Glúteos",
  gluteus: "Glúteos",
  hamstrings: "Isquiotibiales",
  quads: "Cuádriceps",
  quadriceps: "Cuádriceps",
  calves: "Gemelos",
  "hip flexors": "Flexores de cadera",
  "lower back": "Lumbar",
  "upper back": "Espalda alta",
  obliques: "Oblicuos",
  core: "Core",
  adductors: "Aductores",
  abductors: "Abductores",
  neck: "Cuello",
  cardio: "Cardio",
  waist: "Cintura",
};

const BODY_PART_ES: Record<string, string> = {
  chest: "Pecho",
  back: "Espalda",
  shoulders: "Hombros",
  "upper arms": "Brazos",
  "lower arms": "Antebrazos",
  "upper legs": "Piernas",
  "lower legs": "Piernas",
  waist: "Core",
  cardio: "Cardio",
  neck: "Cuello",
};

const EQUIPMENT_EN: Record<string, string> = {
  "body weight": "Peso corporal",
  barbell: "Barra",
  dumbbell: "Mancuernas",
  cable: "Polea",
  band: "Banda elástica",
  kettlebell: "Kettlebell",
  machine: "Máquina",
  "smith machine": "Smith",
  "ez barbell": "Barra EZ",
  "olympic barbell": "Barra olímpica",
  "medicine ball": "Balón medicinal",
  "stability ball": "Fitball",
  "resistance band": "Banda de resistencia",
  rope: "Cuerda",
  sled: "Trineo",
  "trap bar": "Barra hexagonal",
  weighted: "Con peso",
  assisted: "Asistido",
};

const NAME_PHRASES: [string, string][] = [
  ["barbell bench press", "Press de banca con barra"],
  ["incline barbell bench press", "Press inclinado con barra"],
  ["decline barbell bench press", "Press declinado con barra"],
  ["dumbbell bench press", "Press de banca con mancuernas"],
  ["incline dumbbell press", "Press inclinado con mancuernas"],
  ["dumbbell fly", "Aperturas con mancuernas"],
  ["cable cross-over", "Cruces en polea"],
  ["chest dip", "Fondos en paralelas (pecho)"],
  ["push-up", "Flexiones"],
  ["pull-up", "Dominadas"],
  ["lat pulldown", "Jalón al pecho"],
  ["barbell bent over row", "Remo con barra"],
  ["dumbbell one arm row", "Remo a una mano con mancuerna"],
  ["seated cable row", "Remo en polea baja"],
  ["barbell romanian deadlift", "Peso muerto rumano con barra"],
  ["barbell deadlift", "Peso muerto convencional"],
  ["barbell full squat", "Sentadilla con barra"],
  ["barbell front squat", "Sentadilla frontal"],
  ["bulgarian split squat", "Sentadilla búlgara"],
  ["dumbbell lunge", "Zancadas con mancuernas"],
  ["barbell hip thrust", "Hip thrust con barra"],
  ["lying leg curl", "Curl femoral tumbado"],
  ["seated leg curl", "Curl femoral sentado"],
  ["lever leg extension", "Extensión de cuádriceps"],
  ["standing calf raise", "Elevación de gemelos de pie"],
  ["barbell military press", "Press militar con barra"],
  ["dumbbell shoulder press", "Press de hombro con mancuernas"],
  ["dumbbell lateral raise", "Elevaciones laterales"],
  ["dumbbell front raise", "Elevaciones frontales"],
  ["dumbbell rear fly", "Pájaros con mancuernas"],
  ["face pull", "Face pull"],
  ["barbell curl", "Curl con barra"],
  ["dumbbell hammer curl", "Curl martillo"],
  ["dumbbell concentration curl", "Curl concentrado"],
  ["triceps pushdown", "Extensiones de tríceps en polea"],
  ["triceps dip", "Fondos de tríceps"],
  ["front plank", "Plancha frontal"],
  ["side plank", "Plancha lateral"],
  ["hanging leg raise", "Elevación de piernas colgado"],
  ["jump rope", "Salto de cuerda"],
  ["sled 45 leg press", "Prensa inclinada 45°"],
  ["sumo squat", "Sentadilla sumo"],
  ["barbell upright row", "Remo al cuello"],
];

const INSTRUCTION_GLOSSARY: [RegExp, string][] = [
  [/lie flat on your back/gi, "Túmbate boca arriba"],
  [/stand with your feet shoulder-width apart/gi, "Ponte de pie con los pies al ancho de hombros"],
  [/keeping your back straight/gi, "Mantén la espalda recta"],
  [/engage your core/gi, "Activa el core"],
  [/slowly lower/gi, "Baja lentamente"],
  [/slowly return/gi, "Vuelve lentamente"],
  [/repeat for the desired number of repetitions/gi, "Repite el número de repeticiones deseado"],
  [/pause for a moment/gi, "Haz una pausa breve"],
  [/starting position/gi, "posición inicial"],
  [/shoulder-width apart/gi, "al ancho de hombros"],
  [/knees bent/gi, "rodillas flexionadas"],
  [/feet flat on the ground/gi, "pies apoyados en el suelo"],
  [/controlled movement/gi, "movimiento controlado"],
  [/full range of motion/gi, "rango completo de movimiento"],
  [/exhale/gi, "espira"],
  [/inhale/gi, "inspira"],
  [/squeeze/gi, "aprieta"],
  [/grip/gi, "agarre"],
  [/barbell/gi, "barra"],
  [/dumbbell/gi, "mancuerna"],
];

function normalizeKey(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

export function translateMuscle(value: string): string {
  const key = normalizeKey(value);
  return MUSCLE_ES[key] ?? titleCaseEs(key);
}

export function translateBodyPart(value: string): string {
  const key = normalizeKey(value);
  return BODY_PART_ES[key] ?? titleCaseEs(key);
}

export function translateEquipmentEn(value: string): string {
  const key = normalizeKey(value);
  return EQUIPMENT_EN[key] ?? titleCaseEs(key);
}

function titleCaseEs(value: string): string {
  return value
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function translateExerciseName(name: string): string {
  if (/[áéíóúñ¿¡]/i.test(name)) return name.trim();
  const lower = normalizeKey(name);
  const sorted = [...NAME_PHRASES].sort((a, b) => b[0].length - a[0].length);

  for (const [en, es] of sorted) {
    if (lower === en) return es;
  }
  for (const [en, es] of sorted) {
    if (lower.includes(en)) return titleCaseEs(lower.replace(en, es));
  }

  let result = lower;
  const wordMap: Record<string, string> = {
    barbell: "con barra",
    dumbbell: "con mancuernas",
    cable: "en polea",
    seated: "sentado",
    standing: "de pie",
    incline: "inclinado",
    decline: "declinado",
    lateral: "lateral",
    front: "frontal",
    rear: "posterior",
    single: "a una",
    alternating: "alterno",
    reverse: "inverso",
    close: "cerrado",
    wide: "ancho",
    narrow: "estrecho",
    press: "press",
    curl: "curl",
    row: "remo",
    raise: "elevación",
    extension: "extensión",
    fly: "apertura",
    squat: "sentadilla",
    lunge: "zancada",
    deadlift: "peso muerto",
    pull: "jalón",
    push: "empuje",
    dip: "fondos",
    crunch: "crunch",
    plank: "plancha",
    hold: "isométrico",
    stretch: "estiramiento",
  };

  for (const [en, es] of Object.entries(wordMap)) {
    result = result.replace(new RegExp(`\\b${en}\\b`, "gi"), es);
  }

  return titleCaseEs(result);
}

export function translateInstructions(text: string): string {
  if (!text.trim()) return "";
  if (/[áéíóúñ¿¡]/i.test(text) && !/\b(the|your|with|and)\b/i.test(text)) {
    return text.trim();
  }

  let out = text.trim();
  for (const [pattern, replacement] of INSTRUCTION_GLOSSARY) {
    out = out.replace(pattern, replacement);
  }

  return out;
}

export interface LocalizableCatalog {
  name: string;
  instructions?: string | null;
  muscle_subgroup?: string;
  target_muscles?: string[];
  secondary_muscles?: string[];
  body_parts?: string[];
  equipment?: string[];
}

export function localizeCatalogExercise<T extends LocalizableCatalog>(exercise: T): T {
  return {
    ...exercise,
    name: translateExerciseName(exercise.name),
    instructions: exercise.instructions
      ? translateInstructions(exercise.instructions)
      : exercise.instructions,
    muscle_subgroup: exercise.muscle_subgroup
      ? translateMuscle(exercise.muscle_subgroup)
      : exercise.muscle_subgroup,
    target_muscles: exercise.target_muscles?.map(translateMuscle),
    secondary_muscles: exercise.secondary_muscles?.map(translateMuscle),
    body_parts: exercise.body_parts?.map(translateBodyPart),
  };
}
