import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { withExerciseMedia } from "@/lib/gym/enrich-catalog-response";
import { insertExerciseWithSets } from "@/lib/gym/routine-mutations";
import type { PlannedSet } from "@/lib/gym/sets";

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: {
    routine_id?: string;
    exercise_catalog_id?: string;
    sort_order?: number;
    planned_sets?: PlannedSet[];
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

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

  const { data: existing } = await supabase
    .from("gym_exercises")
    .select("id")
    .eq("routine_id", routine_id)
    .eq("exercise_catalog_id", exercise_catalog_id)
    .maybeSingle();

  if (existing) return jsonError("Ese ejercicio ya está en el flujo");

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

  try {
    const exercise = await insertExerciseWithSets(
      supabase,
      user!.id,
      routine_id,
      catalog,
      order,
      planned_sets
    );
    return NextResponse.json(exercise, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo añadir ejercicio" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const { id } = body;
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
