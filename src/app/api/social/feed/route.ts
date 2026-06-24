import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { getFriendIds } from "@/lib/social/friends";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await getSupabaseServerClient();
  const friendIds = await getFriendIds(supabase, user!.id);

  if (!friendIds.length) {
    return NextResponse.json([]);
  }

  const { data: posts, error: postsError } = await supabase
    .from("workout_posts")
    .select("id, user_id, session_id, routine_name, duration_seconds, exercise_count, set_count, created_at")
    .in("user_id", friendIds)
    .order("created_at", { ascending: false })
    .limit(50);

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  if (!posts?.length) {
    return NextResponse.json([]);
  }

  const postIds = posts.map((p) => p.id);
  const userIds = [...new Set(posts.map((p) => p.user_id))];

  const [{ data: profiles }, { data: likes }, { data: comments }] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", userIds),
    supabase.from("workout_post_likes").select("post_id, user_id").in("post_id", postIds),
    supabase
      .from("workout_post_comments")
      .select("id, post_id, user_id, body, created_at")
      .in("post_id", postIds)
      .order("created_at", { ascending: true }),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  const commentUserIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  const { data: commentProfiles } = commentUserIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", commentUserIds)
    : { data: [] };
  const commentProfileMap = new Map((commentProfiles ?? []).map((p) => [p.id, p.display_name]));

  const likeCount = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const like of likes ?? []) {
    likeCount.set(like.post_id, (likeCount.get(like.post_id) ?? 0) + 1);
    if (like.user_id === user!.id) likedByMe.add(like.post_id);
  }

  const commentsByPost = new Map<string, typeof comments>();
  for (const comment of comments ?? []) {
    const list = commentsByPost.get(comment.post_id) ?? [];
    list.push(comment);
    commentsByPost.set(comment.post_id, list);
  }

  return NextResponse.json(
    posts.map((post) => ({
      ...post,
      author_name: profileMap.get(post.user_id) ?? "Usuario",
      like_count: likeCount.get(post.id) ?? 0,
      liked_by_me: likedByMe.has(post.id),
      comments: (commentsByPost.get(post.id) ?? []).map((c) => ({
        id: c.id,
        body: c.body,
        created_at: c.created_at,
        user_id: c.user_id,
        author_name: commentProfileMap.get(c.user_id) ?? "Usuario",
      })),
    }))
  );
}
