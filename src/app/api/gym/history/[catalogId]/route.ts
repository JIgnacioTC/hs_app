import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-helpers";
import type { ExerciseHistory, HistoryPoint } from "@/lib/gym/sets";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ catalogId: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { catalogId } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: catalog } = await supabase
    .from("exercise_catalog")
    .select("id, name")
    .eq("id", catalogId)
    .single();

  const { data: logs, error: dbError } = await supabase
    .from("gym_set_logs")
    .select("*")
    .eq("user_id", user!.id)
    .eq("exercise_catalog_id", catalogId)
    .order("completed_at", { ascending: true });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const byDate = new Map<string, HistoryPoint>();

  for (const log of logs ?? []) {
    const date = log.completed_at.split("T")[0];
    const existing = byDate.get(date) ?? {
      date,
      max_weight: null,
      total_reps: 0,
      avg_rir: null,
      sets: 0,
    };

    existing.sets += 1;
    if (log.weight_kg != null) {
      existing.max_weight = Math.max(existing.max_weight ?? 0, Number(log.weight_kg));
    }
    if (log.reps != null) existing.total_reps = (existing.total_reps ?? 0) + log.reps;
    byDate.set(date, existing);
  }

  const rirByDate = new Map<string, number[]>();
  for (const log of logs ?? []) {
    if (log.rir == null) continue;
    const date = log.completed_at.split("T")[0];
    const arr = rirByDate.get(date) ?? [];
    arr.push(log.rir);
    rirByDate.set(date, arr);
  }

  const points = [...byDate.values()].map((p) => {
    const rirs = rirByDate.get(p.date);
    return {
      ...p,
      avg_rir: rirs?.length
        ? Math.round((rirs.reduce((a, b) => a + b, 0) / rirs.length) * 10) / 10
        : null,
    };
  });

  let personal_record: ExerciseHistory["personal_record"] = null;
  for (const log of logs ?? []) {
    if (log.weight_kg == null) continue;
    if (
      !personal_record ||
      Number(log.weight_kg) > (personal_record.weight_kg ?? 0)
    ) {
      personal_record = {
        weight_kg: Number(log.weight_kg),
        reps: log.reps,
        date: log.completed_at.split("T")[0],
      };
    }
  }

  const sessionIds = new Set((logs ?? []).map((l) => l.session_id));

  const history: ExerciseHistory = {
    catalog_id: catalogId,
    exercise_name: catalog?.name ?? "Ejercicio",
    points,
    personal_record,
    total_sessions: sessionIds.size,
  };

  return NextResponse.json(history);
}
