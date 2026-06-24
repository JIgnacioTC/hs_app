import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-helpers";
import { getDisplayName, notifyUserPush } from "@/lib/social/push-notify";

function postPreview(post: { kind: string; body: string | null; routine_name: string | null }) {
  if (post.kind === "workout") return post.routine_name ?? "Entrenamiento";
  return post.body?.slice(0, 80) ?? "Publicación";
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id: postId } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: post, error: postError } = await supabase
    .from("social_posts")
    .select("id, user_id, kind, body, routine_name")
    .eq("id", postId)
    .maybeSingle();

  if (postError || !post) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("social_post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user!.id)
    .maybeSingle();

  if (existing) {
    const { error: deleteError } = await supabase
      .from("social_post_likes")
      .delete()
      .eq("id", existing.id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    return NextResponse.json({ liked: false });
  }

  const { error: insertError } = await supabase.from("social_post_likes").insert({
    post_id: postId,
    user_id: user!.id,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (post.user_id !== user!.id) {
    const likerName = await getDisplayName(user!.id);
    void notifyUserPush(post.user_id, {
      title: "Nuevo me gusta",
      body: `A ${likerName} le gustó: ${postPreview(post)}`,
      url: `/social?thread=${postId}`,
    });
  }

  return NextResponse.json({ liked: true });
}
