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

export async function swapExerciseCatalog(
  supabase: SupabaseClient,
  userId: string,
  gymExerciseId: string,
  catalog: ExerciseCatalog,
  options?: { preserveSets?: boolean }
) {
  const preserveSets = options?.preserveSets ?? true;

  const { data: existing, error: fetchError } = await supabase
    .from("gym_exercises")
    .select("id, routine_id, gym_planned_sets(*)")
    .eq("id", gymExerciseId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Ejercicio no encontrado");
  }

  const { data: duplicate } = await supabase
    .from("gym_exercises")
    .select("id")
    .eq("routine_id", existing.routine_id)
    .eq("exercise_catalog_id", catalog.id)
    .neq("id", gymExerciseId)
    .maybeSingle();

  if (duplicate) {
    throw new Error("Ese ejercicio ya está en la rutina");
  }

  const enriched = withExerciseMedia(catalog);
  const currentSets = (existing.gym_planned_sets ?? []) as PlannedSet[];
  const nextSets = preserveSets && currentSets.length
    ? currentSets.map((set, index) => ({
        ...set,
        set_number: index + 1,
        rest_seconds: set.rest_seconds || enriched.rest_seconds || 60,
      }))
    : defaultPlannedSets(enriched);

  const legacy = syncLegacyExerciseFields(nextSets);

  const { data: updated, error: updateError } = await supabase
    .from("gym_exercises")
    .update({
      exercise_catalog_id: catalog.id,
      name: catalog.name,
      ...legacy,
    })
    .eq("id", gymExerciseId)
    .eq("user_id", userId)
    .select("*, exercise_catalog(*), gym_planned_sets(*)")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "No se pudo sustituir el ejercicio");
  }

  await savePlannedSetsForExercise(supabase, userId, gymExerciseId, nextSets);

  const { data: withSets } = await supabase
    .from("gym_exercises")
    .select("*, exercise_catalog(*), gym_planned_sets(*)")
    .eq("id", gymExerciseId)
    .single();

  return withNestedExerciseMedia(withSets!);
}
