import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { computeHabitStats } from "@/lib/habits/stats";
import type { CreateHabitPayload } from "@/lib/types";
import { habitPalette } from "@/styles/branding";

const ATOMIC_FIELDS = [
  "name",
  "icon",
  "color",
  "target_days",
  "identity_link",
  "cue",
  "craving",
  "two_minute_version",
  "reward",
  "stack_after_habit_id",
  "implementation_intention",
  "habit_kind",
  "sort_order",
] as const;

async function attachStats(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  userId: string,
  habits: Record<string, unknown>[]
) {
  if (!habits.length) return habits;

  const ids = habits.map((h) => h.id as string);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: logs } = await supabase
    .from("habit_logs")
    .select("habit_id, log_date, completed, completion_type")
    .eq("user_id", userId)
    .in("habit_id", ids)
    .gte("log_date", thirtyDaysAgo.toISOString().split("T")[0]);

  return habits.map((habit) => {
    const habitLogs = (logs ?? []).filter((l) => l.habit_id === habit.id);
    return {
      ...habit,
      stats: computeHabitStats(
        habitLogs,
        (habit.target_days as number[]) ?? [0, 1, 2, 3, 4, 5, 6]
      ),
    };
  });
}

export async function GET(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const withStats = searchParams.get("stats") !== "0";

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("habits")
    .select("*, stack_after:stack_after_habit_id(id, name)")
    .eq("user_id", user!.id)
    .eq("active", true)
    .order("sort_order");

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const habits = withStats
    ? await attachStats(supabase, user!.id, data ?? [])
    : (data ?? []);

  const ids = habits.map((h) => (h as { id: string }).id);
  let withReminders = habits;

  if (ids.length) {
    const { data: reminders } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user!.id)
      .eq("linked_type", "habit")
      .in("linked_id", ids);

    withReminders = habits.map((h) => ({
      ...h,
      reminder: (reminders ?? []).find((r) => r.linked_id === (h as { id: string }).id) ?? null,
    }));
  }

  return NextResponse.json(withReminders);
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = (await request.json()) as CreateHabitPayload;
  if (!body.name?.trim()) return jsonError("Nombre requerido");

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("habits")
    .insert({
      user_id: user!.id,
      name: body.name.trim(),
      color: body.color ?? habitPalette[0],
      target_days: body.target_days ?? [0, 1, 2, 3, 4, 5, 6],
      identity_link: body.identity_link ?? "",
      cue: body.cue ?? "",
      craving: body.craving ?? "",
      two_minute_version: body.two_minute_version ?? "",
      reward: body.reward ?? "",
      stack_after_habit_id: body.stack_after_habit_id ?? null,
      implementation_intention: body.implementation_intention ?? "",
      habit_kind: body.habit_kind ?? "build",
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return jsonError("ID requerido");

  const payload: Record<string, unknown> = {};
  for (const key of ATOMIC_FIELDS) {
    if (key in updates) payload[key] = updates[key];
  }

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("habits")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user!.id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await request.json();
  if (!id) return jsonError("ID requerido");

  const supabase = await getSupabaseServerClient();
  const { error: dbError } = await supabase
    .from("habits")
    .update({ active: false })
    .eq("id", id)
    .eq("user_id", user!.id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  await supabase
    .from("reminders")
    .update({ enabled: false })
    .eq("user_id", user!.id)
    .eq("linked_type", "habit")
    .eq("linked_id", id);

  return NextResponse.json({ ok: true });
}
