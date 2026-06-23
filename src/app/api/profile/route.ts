import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const supabase = await getSupabaseServerClient();

  const { data, error: dbError } = await supabase
    .from("profiles")
    .update(body)
    .eq("id", user!.id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
