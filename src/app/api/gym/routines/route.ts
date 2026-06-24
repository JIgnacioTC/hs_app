import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { withFlowExerciseMedia } from "@/lib/gym/enrich-catalog-response";
import { insertExerciseWithSets } from "@/lib/gym/routine-mutations";
import type { PlannedSet } from "@/lib/gym/sets";

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

  return NextResponse.json(
    (data ?? []).map((r) =>
      withFlowExerciseMedia(sortRoutine(r) as Parameters<typeof withFlowExerciseMedia>[0])
    )
  );
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: {
    name?: string;
    description?: string;
    steps?: Array<{ exercise_catalog_id: string; planned_sets?: PlannedSet[] }>;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const { name, description, steps } = body;
  if (!name?.trim()) return jsonError("Nombre requerido");

  const supabase = await getSupabaseServerClient();

  const { data: routine, error: dbError } = await supabase
    .from("gym_routines")
    .insert({ user_id: user!.id, name: name.trim(), description: description ?? null })
    .select()
    .single();

  if (dbError || !routine) {
    return NextResponse.json({ error: dbError?.message ?? "Error al crear flujo" }, { status: 500 });
  }

  if (steps?.length) {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step.exercise_catalog_id) {
        await supabase.from("gym_routines").delete().eq("id", routine.id);
        return jsonError("Cada paso necesita exercise_catalog_id");
      }

      const { data: catalog, error: catError } = await supabase
        .from("exercise_catalog")
        .select("*")
        .eq("id", step.exercise_catalog_id)
        .eq("active", true)
        .single();

      if (catError || !catalog) {
        await supabase.from("gym_routines").delete().eq("id", routine.id);
        return jsonError("Ejercicio no encontrado", 404);
      }

      try {
        await insertExerciseWithSets(
          supabase,
          user!.id,
          routine.id,
          catalog,
          i,
          step.planned_sets
        );
      } catch (err) {
        await supabase.from("gym_routines").delete().eq("id", routine.id);
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "No se pudo crear el flujo" },
          { status: 500 }
        );
      }
    }
  }

  const { data: full } = await supabase
    .from("gym_routines")
    .select("*, gym_exercises(*, exercise_catalog(*), gym_planned_sets(*))")
    .eq("id", routine.id)
    .single();

  return NextResponse.json(
    withFlowExerciseMedia(sortRoutine(full!) as Parameters<typeof withFlowExerciseMedia>[0]),
    { status: 201 }
  );
}

export async function DELETE(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const { id } = body;
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
