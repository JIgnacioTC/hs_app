import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { timeAndDaysToCron } from "@/lib/cron";

async function getHabit(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  userId: string,
  habitId: string
) {
  const { data } = await supabase
    .from("habits")
    .select("id, name, target_days, two_minute_version, implementation_intention, cue")
    .eq("id", habitId)
    .eq("user_id", userId)
    .eq("active", true)
    .single();
  return data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const habit = await getHabit(supabase, user!.id, id);
  if (!habit) return jsonError("Hábito no encontrado", 404);

  const { data } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", user!.id)
    .eq("linked_type", "habit")
    .eq("linked_id", id)
    .maybeSingle();

  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { enabled, hour, minute } = body as {
    enabled?: boolean;
    hour?: number;
    minute?: number;
  };

  const supabase = await getSupabaseServerClient();
  const habit = await getHabit(supabase, user!.id, id);
  if (!habit) return jsonError("Hábito no encontrado", 404);

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user!.id)
    .single();

  const { data: existing } = await supabase
    .from("reminders")
    .select("id")
    .eq("user_id", user!.id)
    .eq("linked_type", "habit")
    .eq("linked_id", id)
    .maybeSingle();

  if (enabled === false) {
    if (existing) {
      await supabase.from("reminders").update({ enabled: false }).eq("id", existing.id);
    }
    return NextResponse.json({ enabled: false });
  }

  if (hour == null || minute == null) {
    return jsonError("Hora y minuto requeridos");
  }

  const cron = timeAndDaysToCron(hour, minute, habit.target_days ?? [0, 1, 2, 3, 4, 5, 6]);
  const reminderBody =
    habit.two_minute_version ||
    habit.implementation_intention ||
    (habit.cue ? `Cuando ${habit.cue}, ${habit.name}` : `Es hora de: ${habit.name}`);

  const row = {
    user_id: user!.id,
    title: habit.name,
    body: reminderBody,
    cron_expression: cron,
    timezone: profile?.timezone ?? "UTC",
    linked_type: "habit" as const,
    linked_id: id,
    enabled: true,
  };

  if (existing) {
    const { data, error: dbError } = await supabase
      .from("reminders")
      .update({ ...row, last_sent_at: null })
      .eq("id", existing.id)
      .select()
      .single();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error: dbError } = await supabase.from("reminders").insert(row).select().single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
