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
  const body = await request.json();
  const {
    gym_exercise_id,
    exercise_catalog_id,
    set_number,
    reps,
    duration_seconds,
    weight_kg,
    rir,
    rest_seconds_used,
  } = body;

  if (!gym_exercise_id || !set_number) return jsonError("Datos de serie incompletos");

  const supabase = await getSupabaseServerClient();

  const { data: session } = await supabase
    .from("gym_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .eq("user_id", user!.id)
    .single();

  if (!session) return jsonError("Sesión no encontrada", 404);
  if (session.status !== "active") return jsonError("Sesión no activa");

  const { data, error: dbError } = await supabase
    .from("gym_set_logs")
    .insert({
      session_id: sessionId,
      user_id: user!.id,
      gym_exercise_id,
      exercise_catalog_id: exercise_catalog_id ?? null,
      set_number,
      reps: reps ?? null,
      duration_seconds: duration_seconds ?? null,
      weight_kg: weight_kg ?? null,
      rir: rir ?? null,
      rest_seconds_used: rest_seconds_used ?? null,
    })
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
