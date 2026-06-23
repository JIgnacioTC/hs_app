import { NextResponse } from "next/server";
import { listExerciseDbMuscles } from "@/lib/gym/exercisedb/client";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const muscles = await listExerciseDbMuscles();
    return NextResponse.json(muscles);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al consultar ExerciseDB";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
