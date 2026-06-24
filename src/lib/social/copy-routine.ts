import type { SupabaseClient } from "@supabase/supabase-js";

interface SourceExercise {
  exercise_catalog_id: string | null;
  name: string;
  sets: number;
  reps: string;
  weight: string | null;
  rest_seconds: number;
  sort_order: number;
  gym_planned_sets?: Array<{
    set_number: number;
    target_reps: number | null;
    target_seconds: number | null;
    target_weight_kg: number | null;
    target_rir: number | null;
    rest_seconds: number;
  }>;
}

export async function copyRoutineToUser(
  admin: SupabaseClient,
  sourceRoutineId: string,
  fromUserId: string,
  toUserId: string,
  nameSuffix?: string
) {
  const { data: source, error: sourceError } = await admin
    .from("gym_routines")
    .select("id, name, description, gym_exercises(*, gym_planned_sets(*))")
    .eq("id", sourceRoutineId)
    .eq("user_id", fromUserId)
    .eq("active", true)
    .single();

  if (sourceError || !source) {
    throw new Error("Rutina no encontrada");
  }

  const exercises = ((source.gym_exercises ?? []) as SourceExercise[]).sort(
    (a, b) => a.sort_order - b.sort_order
  );

  if (!exercises.length) {
    throw new Error("La rutina no tiene ejercicios");
  }

  const { count } = await admin
    .from("gym_routines")
    .select("*", { count: "exact", head: true })
    .eq("user_id", toUserId)
    .eq("active", true);

  const routineName = nameSuffix ? `${source.name}${nameSuffix}` : source.name;

  const { data: newRoutine, error: routineError } = await admin
    .from("gym_routines")
    .insert({
      user_id: toUserId,
      name: routineName,
      description: source.description,
      sort_order: count ?? 0,
    })
    .select("id, name")
    .single();

  if (routineError || !newRoutine) {
    throw new Error(routineError?.message ?? "No se pudo crear la rutina");
  }

  for (const ex of exercises) {
    const sets = (ex.gym_planned_sets ?? []).sort((a, b) => a.set_number - b.set_number);

    const { data: newEx, error: exError } = await admin
      .from("gym_exercises")
      .insert({
        routine_id: newRoutine.id,
        user_id: toUserId,
        exercise_catalog_id: ex.exercise_catalog_id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        rest_seconds: ex.rest_seconds,
        sort_order: ex.sort_order,
      })
      .select("id")
      .single();

    if (exError || !newEx) {
      throw new Error(exError?.message ?? "No se pudo copiar un ejercicio");
    }

    if (sets.length) {
      const { error: setsError } = await admin.from("gym_planned_sets").insert(
        sets.map((s) => ({
          gym_exercise_id: newEx.id,
          user_id: toUserId,
          set_number: s.set_number,
          target_reps: s.target_reps,
          target_seconds: s.target_seconds,
          target_weight_kg: s.target_weight_kg,
          target_rir: s.target_rir,
          rest_seconds: s.rest_seconds,
        }))
      );
      if (setsError) throw new Error(setsError.message);
    }
  }

  return newRoutine;
}
