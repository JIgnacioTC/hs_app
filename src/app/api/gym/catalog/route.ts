import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-helpers";
import { withExerciseMedia, withExerciseMediaList } from "@/lib/gym/enrich-catalog-response";

export async function GET(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const muscleGroup = searchParams.get("muscle_group");
  const subgroup = searchParams.get("subgroup");
  const exerciseType = searchParams.get("exercise_type");
  const sort = searchParams.get("sort") ?? "name";
  const id = searchParams.get("id");
  const q = searchParams.get("q")?.trim().toLowerCase();

  const supabase = await getSupabaseServerClient();

  if (id) {
    const { data, error: singleError } = await supabase
      .from("exercise_catalog")
      .select("*")
      .eq("id", id)
      .eq("active", true)
      .single();

    if (singleError || !data) {
      return NextResponse.json({ error: "Ejercicio no encontrado" }, { status: 404 });
    }

    const { data: logs } = await supabase
      .from("gym_set_logs")
      .select("exercise_catalog_id")
      .eq("user_id", user!.id)
      .eq("exercise_catalog_id", id);

    return NextResponse.json(
      withExerciseMedia({
        ...data,
        activity_count: logs?.length ?? 0,
      })
    );
  }

  let query = supabase.from("exercise_catalog").select("*").eq("active", true);

  if (muscleGroup) query = query.eq("muscle_group", muscleGroup);
  if (subgroup) query = query.eq("muscle_subgroup", subgroup);
  if (exerciseType) query = query.eq("exercise_type", exerciseType);

  const { data, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  let items = data ?? [];

  const { data: logs } = await supabase
    .from("gym_set_logs")
    .select("exercise_catalog_id")
    .eq("user_id", user!.id);

  const activityMap = new Map<string, number>();
  for (const log of logs ?? []) {
    if (!log.exercise_catalog_id) continue;
    activityMap.set(
      log.exercise_catalog_id,
      (activityMap.get(log.exercise_catalog_id) ?? 0) + 1
    );
  }

  items = items.map((e) => ({
    ...e,
    activity_count: activityMap.get(e.id) ?? 0,
  }));

  if (q) {
    items = items.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscle_subgroup.toLowerCase().includes(q) ||
        e.slug.includes(q)
    );
  }

  if (sort === "activity") {
    items.sort(
      (a, b) =>
        (b.activity_count ?? 0) - (a.activity_count ?? 0) ||
        a.name.localeCompare(b.name, "es")
    );
  } else {
    items.sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  return NextResponse.json(withExerciseMediaList(items));
}
