import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { withFlowExerciseMedia } from "@/lib/gym/enrich-catalog-response";
import { createWorkoutPostForSession } from "@/lib/social/workout-post";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const { data, error: dbError } = await supabase
    .from("gym_sessions")
    .select(
      "*, gym_routines(*, gym_exercises(*, exercise_catalog(*), gym_planned_sets(*))), set_logs:gym_set_logs(*)"
    )
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (dbError || !data) {
    return jsonError("Sesión no encontrada", 404);
  }

  const routine = data.gym_routines
    ? withFlowExerciseMedia(
        sortRoutine(data.gym_routines) as Parameters<typeof withFlowExerciseMedia>[0]
      )
    : null;

  return NextResponse.json({
    ...data,
    gym_routines: routine,
    set_logs: (data.set_logs ?? []).sort(
      (a: { completed_at: string }, b: { completed_at: string }) =>
        a.completed_at.localeCompare(b.completed_at)
    ),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  let body: { status?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const allowed = ["active", "completed", "abandoned"];
  if (body.status && !allowed.includes(body.status)) {
    return jsonError("Estado no válido");
  }

  const supabase = await getSupabaseServerClient();

  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.status === "completed" || body.status === "abandoned") {
    updates.completed_at = new Date().toISOString();
  }
  if (body.notes !== undefined) updates.notes = body.notes;

  if (!Object.keys(updates).length) return jsonError("Nada que actualizar");

  const { data, error: dbError } = await supabase
    .from("gym_sessions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user!.id)
    .select()
    .single();

  if (dbError || !data) {
    return jsonError("Sesión no encontrada", 404);
  }

  if (body.status === "completed") {
    await createWorkoutPostForSession(supabase, id, user!.id);
  }

  return NextResponse.json(data);
}
