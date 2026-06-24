import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { defaultPlannedSets } from "@/lib/gym/sets";
import { withExerciseMedia, withNestedExerciseMedia } from "@/lib/gym/enrich-catalog-response";

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const { routine_id, exercise_catalog_id, sort_order, planned_sets } = body;

  if (!routine_id) return jsonError("routine_id requerido");
  if (!exercise_catalog_id) return jsonError("Selecciona un ejercicio del catálogo");

  const supabase = await getSupabaseServerClient();

  const { data: routine } = await supabase
    .from("gym_routines")
    .select("id")
    .eq("id", routine_id)
    .eq("user_id", user!.id)
    .single();

  if (!routine) return jsonError("Flujo no encontrado", 404);

  const { data: catalog, error: catError } = await supabase
    .from("exercise_catalog")
    .select("*")
    .eq("id", exercise_catalog_id)
    .eq("active", true)
    .single();

  if (catError || !catalog) return jsonError("Ejercicio no encontrado", 404);

  let order = sort_order;
  if (order === undefined || order === null) {
    const { count } = await supabase
      .from("gym_exercises")
      .select("*", { count: "exact", head: true })
      .eq("routine_id", routine_id);
    order = count ?? 0;
  }

  const setsPlan = planned_sets ?? defaultPlannedSets(withExerciseMedia(catalog));

  const { data: exercise, error: dbError } = await supabase
    .from("gym_exercises")
    .insert({
      routine_id,
      user_id: user!.id,
      exercise_catalog_id: catalog.id,
      name: catalog.name,
      sets: setsPlan.length,
      reps: catalog.default_prescription,
      rest_seconds: catalog.rest_seconds,
      sort_order: order,
    })
    .select("*, exercise_catalog(*)")
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const rows = setsPlan.map((s: (typeof setsPlan)[0]) => ({
    gym_exercise_id: exercise.id,
    user_id: user!.id,
    set_number: s.set_number,
    target_reps: s.target_reps,
    target_seconds: s.target_seconds,
    target_weight_kg: s.target_weight_kg,
    target_rir: s.target_rir,
    rest_seconds: s.rest_seconds,
  }));

  await supabase.from("gym_planned_sets").insert(rows);

  const { data: withSets } = await supabase
    .from("gym_exercises")
    .select("*, exercise_catalog(*), gym_planned_sets(*)")
    .eq("id", exercise.id)
    .single();

  return NextResponse.json(withNestedExerciseMedia(withSets!), { status: 201 });
}

export async function DELETE(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await request.json();
  if (!id) return jsonError("ID requerido");

  const supabase = await getSupabaseServerClient();
  const { error: dbError } = await supabase
    .from("gym_exercises")
    .delete()
    .eq("id", id)
    .eq("user_id", user!.id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
