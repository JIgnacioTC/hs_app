import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id: postId } = await params;
  const { body } = await request.json();
  const text = typeof body === "string" ? body.trim() : "";
  if (!text) return jsonError("Comentario vacío");

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("workout_post_comments")
    .insert({
      post_id: postId,
      user_id: user!.id,
      body: text,
    })
    .select("id, post_id, user_id, body, created_at")
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();

  return NextResponse.json({
    ...data,
    author_name: profile?.display_name ?? "Usuario",
  });
}
