import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { swapExerciseCatalog } from "@/lib/gym/routine-mutations";
import { withNestedExerciseMedia } from "@/lib/gym/enrich-catalog-response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  let body: { sort_order?: number; exercise_catalog_id?: string; preserve_sets?: boolean };
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const supabase = await getSupabaseServerClient();

  if (body.exercise_catalog_id) {
    const { data: catalog, error: catalogError } = await supabase
      .from("exercise_catalog")
      .select("*")
      .eq("id", body.exercise_catalog_id)
      .eq("active", true)
      .single();

    if (catalogError || !catalog) {
      return jsonError("Ejercicio de catálogo no encontrado", 404);
    }

    try {
      const swapped = await swapExerciseCatalog(supabase, user!.id, id, catalog, {
        preserveSets: body.preserve_sets !== false,
      });
      return NextResponse.json(swapped);
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : "No se pudo sustituir", 400);
    }
  }

  if (body.sort_order === undefined || body.sort_order === null) {
    return jsonError("sort_order o exercise_catalog_id requerido");
  }

  const { data: exercise } = await supabase
    .from("gym_exercises")
    .select("id, routine_id")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!exercise) return jsonError("Ejercicio no encontrado", 404);

  const { data, error: dbError } = await supabase
    .from("gym_exercises")
    .update({ sort_order: body.sort_order })
    .eq("id", id)
    .eq("user_id", user!.id)
    .select("*, exercise_catalog(*), gym_planned_sets(*)")
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(withNestedExerciseMedia(data!));
}
