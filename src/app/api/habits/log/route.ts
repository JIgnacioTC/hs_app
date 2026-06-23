import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", user!.id)
    .eq("log_date", date);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { habit_id, log_date, completed, completion_type, reflection } = await request.json();
  if (!habit_id) return jsonError("habit_id requerido");

  const date = log_date ?? new Date().toISOString().split("T")[0];
  const supabase = await getSupabaseServerClient();

  const { data, error: dbError } = await supabase
    .from("habit_logs")
    .upsert(
      {
        habit_id,
        user_id: user!.id,
        log_date: date,
        completed: completed ?? true,
        completion_type: completion_type ?? "full",
        reflection: reflection ?? null,
      },
      { onConflict: "habit_id,log_date" }
    )
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

  const { habit_id, log_date } = await request.json();
  if (!habit_id) return jsonError("habit_id requerido");

  const date = log_date ?? new Date().toISOString().split("T")[0];
  const supabase = await getSupabaseServerClient();

  const { error: dbError } = await supabase
    .from("habit_logs")
    .delete()
    .eq("habit_id", habit_id)
    .eq("user_id", user!.id)
    .eq("log_date", date);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
