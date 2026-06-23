import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import type { PlannedSet } from "@/lib/gym/sets";

async function savePlannedSets(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  userId: string,
  gymExerciseId: string,
  sets: PlannedSet[]
) {
  await supabase.from("gym_planned_sets").delete().eq("gym_exercise_id", gymExerciseId);

  if (!sets.length) return;

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const { data, error: dbError } = await supabase
    .from("gym_planned_sets")
    .select("*")
    .eq("gym_exercise_id", id)
    .eq("user_id", user!.id)
    .order("set_number");

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const { sets } = (await request.json()) as { sets: PlannedSet[] };

  if (!Array.isArray(sets)) return jsonError("sets requerido");

  const supabase = await getSupabaseServerClient();

  const { data: exercise } = await supabase
    .from("gym_exercises")
    .select("id")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!exercise) return jsonError("Ejercicio no encontrado", 404);

  try {
    await savePlannedSets(supabase, user!.id, id, sets);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  const { data } = await supabase
    .from("gym_planned_sets")
    .select("*")
    .eq("gym_exercise_id", id)
    .order("set_number");

  return NextResponse.json(data);
}
