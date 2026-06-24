import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-helpers";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id: postId } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: existing } = await supabase
    .from("workout_post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user!.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("workout_post_likes").delete().eq("id", existing.id);
    return NextResponse.json({ liked: false });
  }

  const { error: insertError } = await supabase.from("workout_post_likes").insert({
    post_id: postId,
    user_id: user!.id,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ liked: true });
}
