import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { withFlowExerciseMedia } from "@/lib/gym/enrich-catalog-response";

function sortRoutine(routine: {
  gym_exercises?: Array<{ sort_order: number; gym_planned_sets?: { set_number: number }[] }>;
}) {
  return {
    ...routine,
    gym_exercises: (routine.gym_exercises ?? [])
      .map((ex) => ({
        ...ex,
        gym_planned_sets: (ex.gym_planned_sets ?? []).sort(
          (a, b) => a.set_number - b.set_number
        ),
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  let body: { name?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const updates: Record<string, string> = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (body.description !== undefined) updates.description = body.description;

  if (!Object.keys(updates).length) return jsonError("Nada que actualizar");

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("gym_routines")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user!.id)
    .eq("active", true)
    .select("*, gym_exercises(*, exercise_catalog(*), gym_planned_sets(*))")
    .single();

  if (dbError || !data) {
    return jsonError("Flujo no encontrado", 404);
  }

  return NextResponse.json(withFlowExerciseMedia(sortRoutine(data) as Parameters<typeof withFlowExerciseMedia>[0]));
}
