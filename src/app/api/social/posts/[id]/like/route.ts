import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-helpers";
import { getDisplayName, notifyUserPush } from "@/lib/social/push-notify";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id: postId } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: post } = await supabase
    .from("workout_posts")
    .select("user_id, routine_name")
    .eq("id", postId)
    .maybeSingle();

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

  if (post && post.user_id !== user!.id) {
    const likerName = await getDisplayName(user!.id);
    void notifyUserPush(post.user_id, {
      title: "Nuevo me gusta",
      body: `A ${likerName} le gustó tu rutina «${post.routine_name}»`,
      url: "/social",
    });
  }

  return NextResponse.json({ liked: true });
}
