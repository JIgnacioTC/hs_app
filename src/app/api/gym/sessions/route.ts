import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { routine_id } = await request.json();
  if (!routine_id) return jsonError("routine_id requerido");

  const supabase = await getSupabaseServerClient();

  const { data: routine } = await supabase
    .from("gym_routines")
    .select("*, gym_exercises(*, exercise_catalog(*), gym_planned_sets(*))")
    .eq("id", routine_id)
    .eq("user_id", user!.id)
    .eq("active", true)
    .single();

  if (!routine) return jsonError("Flujo no encontrado", 404);

  const exercises = (routine.gym_exercises ?? [])
    .map((ex: { gym_planned_sets?: { set_number: number }[] }) => ({
      ...ex,
      gym_planned_sets: (ex.gym_planned_sets ?? []).sort(
        (a: { set_number: number }, b: { set_number: number }) => a.set_number - b.set_number
      ),
    }))
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);

  if (!exercises.length) return jsonError("El flujo no tiene ejercicios");

  await supabase
    .from("gym_sessions")
    .update({ status: "abandoned" })
    .eq("user_id", user!.id)
    .eq("status", "active");

  const { data: session, error: sessionError } = await supabase
    .from("gym_sessions")
    .insert({
      routine_id,
      user_id: user!.id,
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      session,
      routine: { ...routine, gym_exercises: exercises },
    },
    { status: 201 }
  );
}

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("gym_sessions")
    .select("*, gym_routines(name)")
    .eq("user_id", user!.id)
    .order("started_at", { ascending: false })
    .limit(30);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
