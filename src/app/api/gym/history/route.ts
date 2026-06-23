import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-helpers";

export interface ExerciseActivityStat {
  catalog_id: string;
  name: string;
  muscle_group: string;
  muscle_subgroup: string;
  set_count: number;
  session_count: number;
  last_done: string | null;
}

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await getSupabaseServerClient();

  const { data: sessions, error: sessionsError } = await supabase
    .from("gym_sessions")
    .select("id, started_at, completed_at, status, gym_routines(name)")
    .eq("user_id", user!.id)
    .in("status", ["completed", "active"])
    .order("started_at", { ascending: false })
    .limit(20);

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 });
  }

  const { data: logs, error: logsError } = await supabase
    .from("gym_set_logs")
    .select("exercise_catalog_id, session_id, completed_at, exercise_catalog(id, name, muscle_group, muscle_subgroup)")
    .eq("user_id", user!.id)
    .not("exercise_catalog_id", "is", null);

  if (logsError) {
    return NextResponse.json({ error: logsError.message }, { status: 500 });
  }

  const statsMap = new Map<string, ExerciseActivityStat>();

  for (const log of logs ?? []) {
    const catalogId = log.exercise_catalog_id as string;
    const raw = log.exercise_catalog;
    const catalog = (Array.isArray(raw) ? raw[0] : raw) as {
      id: string;
      name: string;
      muscle_group: string;
      muscle_subgroup: string;
    } | null;
    if (!catalog) continue;

    const existing = statsMap.get(catalogId) ?? {
      catalog_id: catalogId,
      name: catalog.name,
      muscle_group: catalog.muscle_group,
      muscle_subgroup: catalog.muscle_subgroup,
      set_count: 0,
      session_count: 0,
      last_done: null,
    };

    existing.set_count += 1;
    if (!existing.last_done || log.completed_at > existing.last_done) {
      existing.last_done = log.completed_at;
    }
    statsMap.set(catalogId, existing);
  }

  const sessionCounts = new Map<string, Set<string>>();
  for (const log of logs ?? []) {
    const catalogId = log.exercise_catalog_id as string;
    const sessions = sessionCounts.get(catalogId) ?? new Set<string>();
    sessions.add(log.session_id);
    sessionCounts.set(catalogId, sessions);
  }

  const exercise_stats = [...statsMap.values()]
    .map((s) => ({
      ...s,
      session_count: sessionCounts.get(s.catalog_id)?.size ?? 0,
      last_done: s.last_done?.split("T")[0] ?? null,
    }))
    .sort((a, b) => b.set_count - a.set_count || a.name.localeCompare(b.name, "es"));

  return NextResponse.json({
    recent_sessions: sessions ?? [],
    exercise_stats,
  });
}
