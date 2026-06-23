export interface DatasetExercise {
  id: string;
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  instructions: {
    en?: string;
    it?: string;
    tr?: string;
  };
  instruction_steps?: {
    en?: string[];
    it?: string[];
    tr?: string[];
  };
  muscle_group: string;
  secondary_muscles: string[];
  target: string;
  image: string;
  gif_url: string;
  created_at?: string;
}

export interface NormalizedDatasetExercise {
  dataset_id: string;
  name: string;
  slug: string;
  muscle_group: string;
  muscle_subgroup: string;
  exercise_type: string;
  execution_mode: string;
  default_prescription: string;
  equipment: string[];
  rest_type: string;
  rest_seconds: number;
  instructions: string;
  demo_gif_url: string;
  image_url: string;
  body_parts: string[];
  target_muscles: string[];
  secondary_muscles: string[];
}
