import { NextResponse } from "next/server";
import { listExerciseDbExercises } from "@/lib/gym/exercisedb/client";
import { mapMuscleGroupToBodyPart } from "@/lib/gym/exercisedb/normalize";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? undefined;
  const keywords = searchParams.get("keywords") ?? undefined;
  const bodyParts =
    searchParams.get("bodyParts") ??
    (searchParams.get("muscle_group")
      ? mapMuscleGroupToBodyPart(searchParams.get("muscle_group")!)
      : null);
  const targetMuscles = searchParams.get("targetMuscles");
  const equipments = searchParams.get("equipments");
  const exerciseType = searchParams.get("exerciseType");
  const search = searchParams.get("q") ?? searchParams.get("search") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "25");
  const cursor = searchParams.get("cursor") ?? undefined;

  try {
    const { exercises, meta } = await listExerciseDbExercises({
      name,
      keywords,
      bodyParts: bodyParts ?? undefined,
      targetMuscles: targetMuscles ?? undefined,
      equipments: equipments ?? undefined,
      exerciseType: exerciseType ?? undefined,
      search,
      limit: Number.isFinite(limit) ? limit : 25,
      cursor,
    });

    return NextResponse.json({ exercises, meta });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al consultar ExerciseDB";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
