import { translateEquipmentEn } from "@/lib/gym/exercise-dataset/localize-es";

export const MUSCLE_GROUPS = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Brazos",
  "Piernas",
  "Core",
  "Cardio",
  "Movilidad",
] as const;

export const EXERCISE_TYPE_LABELS: Record<string, string> = {
  compuesto: "Compuesto",
  aislamiento: "Aislamiento",
  cardio: "Cardio",
  movilidad: "Movilidad",
  pliometrico: "Pliométrico",
};

export const EXECUTION_MODE_LABELS: Record<string, string> = {
  repeticiones: "Repeticiones",
  tiempo: "Tiempo",
  repeticiones_por_lado: "Por lado",
  distancia: "Distancia",
  isometrico: "Isométrico",
};

export const REST_TYPE_LABELS: Record<string, string> = {
  corto: "Descanso corto",
  medio: "Descanso medio",
  largo: "Descanso largo",
  activo: "Recuperación activa",
  ninguno: "Sin pausa",
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  barra: "Barra",
  mancuernas: "Mancuernas",
  maquina: "Máquina",
  banco_plano: "Banco plano",
  banco_inclinado: "Banco inclinado",
  banco_declinado: "Banco declinado",
  banco: "Banco",
  polea: "Polea",
  peso_corporal: "Peso corporal",
  banda_elastica: "Banda elástica",
  kettlebell: "Kettlebell",
  rack: "Rack",
  barra_fija: "Barra fija",
  paralelas: "Paralelas",
  cuerda: "Cuerda",
  disco: "Disco",
  cinta: "Cinta",
  bicicleta_estatica: "Bici estática",
  maquina_remo: "Remo",
  cuerda_saltar: "Cuerda saltar",
  cuerdas_batalla: "Battle ropes",
  foam_roller: "Foam roller",
  rueda_abdominal: "Rueda abdominal",
  smith: "Smith",
  trx: "TRX",
  ninguno: "Ninguno",
};

export function formatEquipment(equipment: string[]) {
  if (!equipment.length) return "Sin equipo";
  return equipment
    .map((e) => {
      if (EQUIPMENT_LABELS[e]) return EQUIPMENT_LABELS[e];
      return translateEquipmentEn(e.replace(/_/g, " "));
    })
    .join(" · ");
}
