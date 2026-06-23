import { NextResponse } from "next/server";
import { getExerciseDbExercise } from "@/lib/gym/exercisedb/client";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const exercise = await getExerciseDbExercise(id);
    if (!exercise) {
      return NextResponse.json({ error: "Ejercicio no encontrado en ExerciseDB" }, { status: 404 });
    }
    return NextResponse.json(exercise);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al consultar ExerciseDB";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
