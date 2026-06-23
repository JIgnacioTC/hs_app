export interface ExerciseDbImageUrls {
  "360p"?: string;
  "480p"?: string;
  "720p"?: string;
  "1080p"?: string;
}

/** Raw exercise payload from ExerciseDB v1 (OSS) or v2 (RapidAPI). */
export interface ExerciseDbRawExercise {
  exerciseId: string;
  name: string;
  gifUrl?: string;
  imageUrl?: string;
  imageUrls?: ExerciseDbImageUrls;
  videoUrl?: string;
  bodyParts?: string[];
  targetMuscles?: string[];
  secondaryMuscles?: string[];
  equipments?: string[];
  exerciseType?: string;
  instructions?: string[] | string;
  overview?: string;
  exerciseTips?: string[];
  variations?: string[];
  keywords?: string[];
  relatedExerciseIds?: string[];
}

export interface ExerciseDbListMeta {
  total?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  nextCursor?: string;
  previousCursor?: string;
}

export interface ExerciseDbListResponse<T> {
  success: boolean;
  data: T[];
  meta?: ExerciseDbListMeta;
}

export interface ExerciseDbItemResponse<T> {
  success: boolean;
  data: T;
}

export interface ExerciseDbNamedItem {
  name: string;
  id?: number;
  category?: string;
  imageUrl?: string;
}

/** Normalized shape used across the app regardless of API version. */
export interface NormalizedExerciseDbExercise {
  exercisedb_id: string;
  name: string;
  demo_media_url: string | null;
  image_url: string | null;
  image_urls: ExerciseDbImageUrls | null;
  video_url: string | null;
  body_parts: string[];
  target_muscles: string[];
  secondary_muscles: string[];
  equipments: string[];
  exercise_type: string | null;
  instructions: string;
  overview: string | null;
  exercise_tips: string[];
  variations: string[];
  keywords: string[];
  related_exercise_ids: string[];
}

export interface ExerciseDbQuery {
  /** RapidAPI v2: search by exercise name */
  name?: string;
  /** RapidAPI v2: comma-separated keywords e.g. "chest workout,barbell" */
  keywords?: string;
  /** OSS v1: filter by body part slug */
  bodyParts?: string;
  targetMuscles?: string;
  equipments?: string;
  exerciseType?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}
