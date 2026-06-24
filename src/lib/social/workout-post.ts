import type { SupabaseClient } from "@supabase/supabase-js";

export async function createWorkoutPostForSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
) {
  const { data: session } = await supabase
    .from("gym_sessions")
    .select("id, user_id, started_at, completed_at, gym_routines(name)")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (!session?.completed_at) return null;

  const { count: setCount } = await supabase
    .from("gym_set_logs")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  const { data: exerciseIds } = await supabase
    .from("gym_set_logs")
    .select("gym_exercise_id")
    .eq("session_id", sessionId);

  const uniqueExercises = new Set((exerciseIds ?? []).map((r) => r.gym_exercise_id)).size;
  const durationSeconds = Math.max(
    0,
    Math.floor(
      (new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000
    )
  );

  const routineName =
    (session.gym_routines as { name?: string } | null)?.name ?? "Rutina";

  const { data: existing } = await supabase
    .from("social_posts")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("social_posts")
    .insert({
      user_id: userId,
      kind: "workout",
      session_id: sessionId,
      routine_name: routineName,
      duration_seconds: durationSeconds,
      exercise_count: uniqueExercises,
      set_count: setCount ?? 0,
    })
    .select("id")
    .single();

  if (error) return null;
  return data;
}
