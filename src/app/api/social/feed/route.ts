import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-helpers";
import { enrichPosts, getFeedAuthorIds, type SocialPostRow } from "@/lib/social/posts";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await getSupabaseServerClient();
  const authorIds = await getFeedAuthorIds(supabase, user!.id);

  const { data: posts, error: postsError } = await supabase
    .from("social_posts")
    .select("*")
    .in("user_id", authorIds)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  const enriched = await enrichPosts(supabase, user!.id, (posts ?? []) as SocialPostRow[]);
  return NextResponse.json(enriched);
}
