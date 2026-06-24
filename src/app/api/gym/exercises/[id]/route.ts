import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { withNestedExerciseMedia } from "@/lib/gym/enrich-catalog-response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  let body: { sort_order?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  if (body.sort_order === undefined || body.sort_order === null) {
    return jsonError("sort_order requerido");
  }

  const supabase = await getSupabaseServerClient();

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
