import type { SupabaseClient } from "@supabase/supabase-js";
import { insertExerciseWithSets } from "@/lib/gym/routine-mutations";
import {
  STARTER_PLANS,
  type TrainingGoalId,
} from "@/lib/gym/onboarding";
import type { ExerciseCatalog } from "@/lib/types";

export async function createStarterRoutine(
  supabase: SupabaseClient,
  userId: string,
  goal: TrainingGoalId
) {
  const plan = STARTER_PLANS[goal] ?? STARTER_PLANS.general;

  const { data: existing } = await supabase
    .from("gym_routines")
    .select("id, name")
    .eq("user_id", userId)
    .eq("active", true)
    .eq("name", plan.name)
    .maybeSingle();

  if (existing) return existing;

  const picked: ExerciseCatalog[] = [];

  for (const muscle of plan.muscles) {
    const { data } = await supabase
      .from("exercise_catalog")
      .select("*")
      .eq("active", true)
      .eq("muscle_group", muscle)
      .eq("exercise_type", "compuesto")
      .order("name")
      .limit(1);

    if (data?.[0]) picked.push(data[0] as ExerciseCatalog);
  }

  if (picked.length < 2) {
    const { data: fallback } = await supabase
      .from("exercise_catalog")
      .select("*")
      .eq("active", true)
      .order("name")
      .limit(4);
    for (const item of fallback ?? []) {
      if (picked.length >= 4) break;
      if (!picked.some((p) => p.id === item.id)) picked.push(item as ExerciseCatalog);
    }
  }

  if (!picked.length) {
    throw new Error("No hay ejercicios en el catálogo");
  }

  const { count } = await supabase
    .from("gym_routines")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("active", true);

  const { data: routine, error: routineError } = await supabase
    .from("gym_routines")
    .insert({
      user_id: userId,
      name: plan.name,
      description: plan.mood,
      sort_order: count ?? 0,
    })
    .select("id, name")
    .single();

  if (routineError || !routine) {
    throw new Error(routineError?.message ?? "No se pudo crear la rutina");
  }

  for (let i = 0; i < picked.length; i++) {
    try {
      await insertExerciseWithSets(supabase, userId, routine.id, picked[i], i);
    } catch {
      /* skip failed exercise */
    }
  }

  return routine;
}
