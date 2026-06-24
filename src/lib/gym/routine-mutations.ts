import type { SupabaseClient } from "@supabase/supabase-js";
import { withExerciseMedia, withNestedExerciseMedia } from "@/lib/gym/enrich-catalog-response";
import { defaultPlannedSets, type PlannedSet } from "@/lib/gym/sets";
import type { ExerciseCatalog } from "@/lib/types";

export function syncLegacyExerciseFields(sets: PlannedSet[]) {
  const first = sets[0];
  return {
    sets: sets.length,
    reps: sets.length ? `${sets.length}×${first.target_reps ?? first.target_seconds ?? "—"}` : "—",
    rest_seconds: first?.rest_seconds ?? 60,
  };
}

export async function insertExerciseWithSets(
  supabase: SupabaseClient,
  userId: string,
  routineId: string,
  catalog: ExerciseCatalog,
  sortOrder: number,
  planned_sets?: PlannedSet[]
) {
  const setsPlan = planned_sets ?? defaultPlannedSets(withExerciseMedia(catalog));
  const legacy = syncLegacyExerciseFields(setsPlan);

  const { data: exercise, error: dbError } = await supabase
    .from("gym_exercises")
    .insert({
      routine_id: routineId,
      user_id: userId,
      exercise_catalog_id: catalog.id,
      name: catalog.name,
      sort_order: sortOrder,
      ...legacy,
    })
    .select("*, exercise_catalog(*)")
    .single();

  if (dbError || !exercise) {
    throw new Error(dbError?.message ?? "No se pudo añadir ejercicio");
  }

  const rows = setsPlan.map((s) => ({
    gym_exercise_id: exercise.id,
    user_id: userId,
    set_number: s.set_number,
    target_reps: s.target_reps,
    target_seconds: s.target_seconds,
    target_weight_kg: s.target_weight_kg,
    target_rir: s.target_rir,
    rest_seconds: s.rest_seconds,
  }));

  const { error: setsError } = await supabase.from("gym_planned_sets").insert(rows);
  if (setsError) {
    await supabase.from("gym_exercises").delete().eq("id", exercise.id);
    throw new Error(setsError.message);
  }

  const { data: withSets } = await supabase
    .from("gym_exercises")
    .select("*, exercise_catalog(*), gym_planned_sets(*)")
    .eq("id", exercise.id)
    .single();

  return withNestedExerciseMedia(withSets!);
}

export async function savePlannedSetsForExercise(
  supabase: SupabaseClient,
  userId: string,
  gymExerciseId: string,
  sets: PlannedSet[]
) {
  await supabase.from("gym_planned_sets").delete().eq("gym_exercise_id", gymExerciseId);

  if (sets.length) {
    const rows = sets.map((s) => ({
      gym_exercise_id: gymExerciseId,
      user_id: userId,
      set_number: s.set_number,
      target_reps: s.target_reps,
      target_seconds: s.target_seconds,
      target_weight_kg: s.target_weight_kg,
      target_rir: s.target_rir,
      rest_seconds: s.rest_seconds,
    }));

    const { error } = await supabase.from("gym_planned_sets").insert(rows);
    if (error) throw new Error(error.message);
  }

  const legacy = syncLegacyExerciseFields(sets);
  await supabase.from("gym_exercises").update(legacy).eq("id", gymExerciseId).eq("user_id", userId);
}
