import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { withFlowExerciseMedia } from "@/lib/gym/enrich-catalog-response";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("gym_routines")
    .select("*, gym_exercises(*, exercise_catalog(*), gym_planned_sets(*))")
    .eq("user_id", user!.id)
    .eq("active", true)
    .order("sort_order");

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const routines = (data ?? []).map((r) => ({
    ...r,
    gym_exercises: (r.gym_exercises ?? [])
      .map((ex: { gym_planned_sets?: { set_number: number }[] }) => ({
        ...ex,
        gym_planned_sets: (ex.gym_planned_sets ?? []).sort(
          (a: { set_number: number }, b: { set_number: number }) => a.set_number - b.set_number
        ),
      }))
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order),
  }));

  return NextResponse.json(routines.map(withFlowExerciseMedia));
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { name, description } = await request.json();
  if (!name) return jsonError("Nombre requerido");

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("gym_routines")
    .insert({ user_id: user!.id, name, description })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await request.json();
  if (!id) return jsonError("ID requerido");

  const supabase = await getSupabaseServerClient();
  const { error: dbError } = await supabase
    .from("gym_routines")
    .update({ active: false })
    .eq("id", id)
    .eq("user_id", user!.id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
