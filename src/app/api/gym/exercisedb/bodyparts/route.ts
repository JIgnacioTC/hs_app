import { NextResponse } from "next/server";
import { listExerciseDbBodyParts } from "@/lib/gym/exercisedb/client";
import { mapBodyPartToMuscleGroup } from "@/lib/gym/exercisedb/normalize";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const bodyParts = await listExerciseDbBodyParts();
    const enriched = bodyParts.map((part) => ({
      ...part,
      muscle_group: mapBodyPartToMuscleGroup(part.name),
    }));
    return NextResponse.json(enriched);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al consultar ExerciseDB";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
