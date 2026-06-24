import type { SupabaseClient } from "@supabase/supabase-js";
import { getFriendIds } from "@/lib/social/friends";

export interface SocialPostRow {
  id: string;
  user_id: string;
  kind: "post" | "workout" | "reply";
  body: string | null;
  parent_id: string | null;
  root_id: string | null;
  session_id: string | null;
  routine_name: string | null;
  duration_seconds: number | null;
  exercise_count: number | null;
  set_count: number | null;
  image_url: string | null;
  created_at: string;
}

export interface EnrichedSocialPost extends SocialPostRow {
  author_name: string;
  like_count: number;
  liked_by_me: boolean;
  reply_count: number;
}

export async function getFeedAuthorIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const friendIds = await getFriendIds(supabase, userId);
  return [...new Set([userId, ...friendIds])];
}

export async function enrichPosts(
  supabase: SupabaseClient,
  userId: string,
  posts: SocialPostRow[]
): Promise<EnrichedSocialPost[]> {
  if (!posts.length) return [];

  const postIds = posts.map((p) => p.id);
  const userIds = [...new Set(posts.map((p) => p.user_id))];

  const [{ data: profiles }, { data: likes }, { data: replyRows }] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", userIds),
    supabase.from("social_post_likes").select("post_id, user_id").in("post_id", postIds),
    supabase.from("social_posts").select("root_id").in("root_id", postIds).eq("kind", "reply"),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  const likeCount = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const like of likes ?? []) {
    likeCount.set(like.post_id, (likeCount.get(like.post_id) ?? 0) + 1);
    if (like.user_id === userId) likedByMe.add(like.post_id);
  }

  const replyCount = new Map<string, number>();
  for (const row of replyRows ?? []) {
    if (!row.root_id) continue;
    replyCount.set(row.root_id, (replyCount.get(row.root_id) ?? 0) + 1);
  }

  return posts.map((post) => ({
    ...post,
    author_name: profileMap.get(post.user_id) ?? "Usuario",
    like_count: likeCount.get(post.id) ?? 0,
    liked_by_me: likedByMe.has(post.id),
    reply_count: replyCount.get(post.id) ?? 0,
  }));
}

export async function enrichPostList(
  supabase: SupabaseClient,
  userId: string,
  postIds: string[]
): Promise<Map<string, EnrichedSocialPost>> {
  if (!postIds.length) return new Map();

  const { data: posts } = await supabase.from("social_posts").select("*").in("id", postIds);

  const enriched = await enrichPosts(supabase, userId, (posts ?? []) as SocialPostRow[]);
  return new Map(enriched.map((p) => [p.id, p]));
}
