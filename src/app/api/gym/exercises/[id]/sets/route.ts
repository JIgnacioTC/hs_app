import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { savePlannedSetsForExercise } from "@/lib/gym/routine-mutations";
import type { PlannedSet } from "@/lib/gym/sets";

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
  let body: { sets?: PlannedSet[] };
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const { sets } = body;
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
    await savePlannedSetsForExercise(supabase, user!.id, id, sets);
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
