import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at");

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  if (!body.title) return jsonError("Título requerido");

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("reminders")
    .insert({
      user_id: user!.id,
      title: body.title,
      body: body.body ?? "",
      cron_expression: body.cron_expression ?? "0 8 * * *",
      timezone: body.timezone ?? "UTC",
      linked_type: body.linked_type ?? "general",
      linked_id: body.linked_id ?? null,
      enabled: body.enabled ?? true,
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

  const { id, ...updates } = await request.json();
  if (!id) return jsonError("ID requerido");

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("reminders")
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

export async function DELETE(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await request.json();
  if (!id) return jsonError("ID requerido");

  const supabase = await getSupabaseServerClient();
  const { error: dbError } = await supabase
    .from("reminders")
    .delete()
    .eq("id", id)
    .eq("user_id", user!.id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
