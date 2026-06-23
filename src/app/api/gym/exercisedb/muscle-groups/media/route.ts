import { NextResponse } from "next/server";
import { buildMuscleGroupMediaMap } from "@/lib/gym/exercisedb/catalog-sync";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const media = await buildMuscleGroupMediaMap();
    return NextResponse.json(media);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al cargar media de grupos";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
