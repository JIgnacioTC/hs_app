export interface Profile {
  id: string;
  display_name: string;
  timezone: string;
  focus_areas: string[];
  identity_statement?: string;
  wizard_completed: boolean;
  created_at: string;
  updated_at: string;
}

export type HabitKind = "build" | "break";
export type CompletionType = "full" | "two_minute";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  target_days: number[];
  sort_order: number;
  active: boolean;
  identity_link?: string;
  cue?: string;
  craving?: string;
  two_minute_version?: string;
  reward?: string;
  stack_after_habit_id?: string | null;
  implementation_intention?: string;
  habit_kind?: HabitKind;
  created_at: string;
  stats?: HabitStats;
  stack_after?: Pick<Habit, "id" | "name"> | null;
  reminder?: Reminder | null;
}

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  completionRate7d: number;
  last7: boolean[];
  missedYesterday: boolean;
  completedToday: boolean;
  todayType?: CompletionType;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;
  completed: boolean;
  completion_type?: CompletionType;
  reflection?: string | null;
  created_at: string;
}

export interface GymRoutine {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  gym_exercises?: GymExercise[];
}

export interface GymExercise {
  id: string;
  routine_id: string;
  user_id: string;
  name: string;
  sets: number;
  reps: string;
  weight: string | null;
  rest_seconds: number;
  sort_order: number;
  exercise_catalog_id: string | null;
  created_at: string;
  exercise_catalog?: ExerciseCatalog | null;
  gym_planned_sets?: PlannedSet[];
}

export interface PlannedSet {
  id: string;
  gym_exercise_id: string;
  user_id: string;
  set_number: number;
  target_reps: number | null;
  target_seconds: number | null;
  target_weight_kg: number | null;
  target_rir: number | null;
  rest_seconds: number;
  created_at?: string;
}

export interface SetLog {
  id: string;
  session_id: string;
  user_id: string;
  gym_exercise_id: string;
  exercise_catalog_id: string | null;
  set_number: number;
  reps: number | null;
  duration_seconds: number | null;
  weight_kg: number | null;
  rir: number | null;
  rest_seconds_used: number | null;
  completed_at: string;
}

export interface GymSession {
  id: string;
  routine_id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  status: "active" | "completed" | "abandoned";
  notes: string | null;
  gym_routines?: { name: string };
  set_logs?: SetLog[];
}

export interface ExerciseCatalog {
  id: string;
  slug: string;
  name: string;
  muscle_group: string;
  muscle_subgroup: string;
  exercise_type: string;
  execution_mode: string;
  default_prescription: string;
  equipment: string[];
  rest_type: string;
  rest_seconds: number;
  instructions: string;
  dataset_id?: string | null;
  demo_gif_url?: string | null;
  image_url?: string | null;
  image_urls?: Record<string, string> | null;
  video_url?: string | null;
  body_parts?: string[];
  target_muscles?: string[];
  secondary_muscles?: string[];
  overview?: string | null;
  exercise_tips?: string[];
  variations?: string[];
  activity_count?: number;
  active: boolean;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  body: string;
  cron_expression: string;
  timezone: string;
  linked_type: "habit" | "gym" | "general" | null;
  linked_id: string | null;
  enabled: boolean;
  last_sent_at: string | null;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface CreateHabitPayload {
  name: string;
  color?: string;
  target_days?: number[];
  identity_link?: string;
  cue?: string;
  craving?: string;
  two_minute_version?: string;
  reward?: string;
  stack_after_habit_id?: string | null;
  implementation_intention?: string;
  habit_kind?: HabitKind;
}

export interface RoutineShare {
  id: string;
  from_user_id: string;
  to_user_id: string;
  source_routine_id: string;
  copied_routine_id: string;
  routine_name: string;
  created_at: string;
  peer_name: string;
}

export interface FriendProfile {
  id: string;
  display_name: string;
}

export interface SocialPost {
  id: string;
  user_id: string;
  kind: "post" | "workout" | "reply";
  body: string | null;
  parent_id: string | null;
  root_id: string | null;
  session_id: string | null;
  routine_name: string | null;
  duration_seconds: number | null;
  exercise_count: number | null;
  set_count: number | null;
  image_url: string | null;
  created_at: string;
  author_name: string;
  like_count: number;
  liked_by_me: boolean;
  reply_count: number;
}

export interface SocialThread {
  post: SocialPost;
  replies: SocialPost[];
}
