import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-helpers";
import { withExerciseMediaList } from "@/lib/gym/enrich-catalog-response";
import {
  alternativeMatchReason,
  rankExerciseAlternatives,
} from "@/lib/gym/suggest-alternatives";

export async function GET(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const catalogId = searchParams.get("catalog_id");
  const limit = Math.min(Math.max(1, Number(searchParams.get("limit")) || 8), 12);
  const excludeParam = searchParams.get("exclude") ?? "";
  const exclude = new Set(
    excludeParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );

  if (!catalogId) {
    return NextResponse.json({ error: "catalog_id requerido" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();

  const { data: source, error: sourceError } = await supabase
    .from("exercise_catalog")
    .select("*")
    .eq("id", catalogId)
    .eq("active", true)
    .single();

  if (sourceError || !source) {
    return NextResponse.json({ error: "Ejercicio no encontrado" }, { status: 404 });
  }

  const { data: pool, error: poolError } = await supabase
    .from("exercise_catalog")
    .select("*")
    .eq("active", true)
    .eq("muscle_group", source.muscle_group);

  if (poolError) {
    return NextResponse.json({ error: poolError.message }, { status: 500 });
  }

  const { data: counts } = await supabase.rpc("user_catalog_activity_counts", {
    p_user_id: user!.id,
  });

  const activityMap = new Map<string, number>();
  for (const row of (counts as { exercise_catalog_id: string; activity_count: number }[]) ?? []) {
    activityMap.set(row.exercise_catalog_id, Number(row.activity_count));
  }

  const candidates = (pool ?? [])
    .filter((item) => item.id !== catalogId && !exclude.has(item.id))
    .map((item) => ({
      ...item,
      activity_count: activityMap.get(item.id) ?? 0,
    }));

  const ranked = rankExerciseAlternatives(source, candidates, limit);
  const enriched = withExerciseMediaList(ranked).map((item) => ({
    ...item,
    match_reason: alternativeMatchReason(source, item),
  }));

  return NextResponse.json({
    source: withExerciseMediaList([source])[0],
    alternatives: enriched,
  });
}
