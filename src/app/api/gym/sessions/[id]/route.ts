import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const { data, error: dbError } = await supabase
    .from("gym_sessions")
    .select("*, gym_routines(*, gym_exercises(*, exercise_catalog(*), gym_planned_sets(*))), set_logs:gym_set_logs(*)")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const supabase = await getSupabaseServerClient();

  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.status === "completed" || body.status === "abandoned") {
    updates.completed_at = new Date().toISOString();
  }
  if (body.notes !== undefined) updates.notes = body.notes;

  const { data, error: dbError } = await supabase
    .from("gym_sessions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user!.id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
