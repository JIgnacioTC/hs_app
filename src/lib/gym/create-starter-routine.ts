import type { SupabaseClient } from "@supabase/supabase-js";
import {
  STARTER_PLANS,
  type TrainingGoalId,
} from "@/lib/gym/onboarding";
import { defaultPlannedSets } from "@/lib/gym/sets";
import type { ExerciseCatalog } from "@/lib/types";

export async function createStarterRoutine(
  supabase: SupabaseClient,
  userId: string,
  goal: TrainingGoalId
) {
  const plan = STARTER_PLANS[goal] ?? STARTER_PLANS.general;
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
    const catalog = picked[i];
    const setsPlan = defaultPlannedSets(catalog);

    const { data: exercise, error: exError } = await supabase
      .from("gym_exercises")
      .insert({
        routine_id: routine.id,
        user_id: userId,
        exercise_catalog_id: catalog.id,
        name: catalog.name,
        sets: setsPlan.length,
        reps: catalog.default_prescription,
        rest_seconds: catalog.rest_seconds,
        sort_order: i,
      })
      .select("id")
      .single();

    if (exError || !exercise) continue;

    await supabase.from("gym_planned_sets").insert(
      setsPlan.map((s) => ({
        gym_exercise_id: exercise.id,
        user_id: userId,
        set_number: s.set_number,
        target_reps: s.target_reps,
        target_seconds: s.target_seconds,
        target_weight_kg: s.target_weight_kg,
        target_rir: s.target_rir,
        rest_seconds: s.rest_seconds,
      }))
    );
  }

  return routine;
}
