import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id: sessionId } = await params;
  let body: {
    gym_exercise_id?: string;
    exercise_catalog_id?: string;
    set_number?: number;
    reps?: number | null;
    duration_seconds?: number | null;
    weight_kg?: number | null;
    rir?: number | null;
    rest_seconds_used?: number | null;
    skipped?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const {
    gym_exercise_id,
    exercise_catalog_id,
    set_number,
    reps,
    duration_seconds,
    weight_kg,
    rir,
    rest_seconds_used,
    skipped,
  } = body;

  if (!gym_exercise_id || !set_number) return jsonError("Datos de serie incompletos");

  const supabase = await getSupabaseServerClient();

  const { data: session } = await supabase
    .from("gym_sessions")
    .select("id, status, routine_id")
    .eq("id", sessionId)
    .eq("user_id", user!.id)
    .single();

  if (!session) return jsonError("Sesión no encontrada", 404);
  if (session.status !== "active") return jsonError("Sesión no activa");

  const { data: exercise } = await supabase
    .from("gym_exercises")
    .select("id, routine_id, exercise_catalog_id")
    .eq("id", gym_exercise_id)
    .eq("user_id", user!.id)
    .single();

  if (!exercise || exercise.routine_id !== session.routine_id) {
    return jsonError("Ejercicio no pertenece a esta sesión", 400);
  }

  const payload = {
    session_id: sessionId,
    user_id: user!.id,
    gym_exercise_id,
    exercise_catalog_id: exercise_catalog_id ?? exercise.exercise_catalog_id,
    set_number,
    reps: skipped ? null : (reps ?? null),
    duration_seconds: skipped ? null : (duration_seconds ?? null),
    weight_kg: skipped ? null : (weight_kg ?? null),
    rir: skipped ? null : (rir ?? null),
    rest_seconds_used: rest_seconds_used ?? null,
    skipped: Boolean(skipped),
  };

  const { data: existing } = await supabase
    .from("gym_set_logs")
    .select("id")
    .eq("session_id", sessionId)
    .eq("gym_exercise_id", gym_exercise_id)
    .eq("set_number", set_number)
    .maybeSingle();

  if (existing) {
    const { data, error: dbError } = await supabase
      .from("gym_set_logs")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  const { data, error: dbError } = await supabase
    .from("gym_set_logs")
    .insert(payload)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
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
    .from("gym_set_logs")
    .select("*")
    .eq("session_id", id)
    .eq("user_id", user!.id)
    .order("completed_at");

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
