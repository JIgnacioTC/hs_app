import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { enrichPosts, type SocialPostRow } from "@/lib/social/posts";
import { getDisplayName, notifyUserPush } from "@/lib/social/push-notify";

function threadRootId(post: { id: string; root_id: string | null; parent_id: string | null }) {
  return post.root_id ?? post.parent_id ?? post.id;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: root, error: rootError } = await supabase
    .from("social_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (rootError || !root) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  const rootId = threadRootId(root as SocialPostRow);

  const { data: replies, error: repliesError } = await supabase
    .from("social_posts")
    .select("*")
    .eq("root_id", rootId)
    .eq("kind", "reply")
    .order("created_at", { ascending: true });

  if (repliesError) {
    return NextResponse.json({ error: repliesError.message }, { status: 500 });
  }

  const all = [root as SocialPostRow, ...((replies ?? []) as SocialPostRow[])];
  const enriched = await enrichPosts(supabase, user!.id, all);
  const [rootPost, ...replyPosts] = enriched;

  return NextResponse.json({ post: rootPost, replies: replyPosts });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const { body, parent_id } = await request.json();
  const text = typeof body === "string" ? body.trim() : "";
  if (!text) return jsonError("Respuesta vacía");

  const supabase = await getSupabaseServerClient();

  const { data: target, error: targetError } = await supabase
    .from("social_posts")
    .select("*")
    .eq("id", parent_id ?? id)
    .maybeSingle();

  if (targetError || !target) {
    return jsonError("Publicación no encontrada", 404);
  }

  const rootId = threadRootId(target as SocialPostRow);

  const { data, error: dbError } = await supabase
    .from("social_posts")
    .insert({
      user_id: user!.id,
      kind: "reply",
      body: text,
      parent_id: target.id,
      root_id: rootId,
    })
    .select("*")
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();

  const [enriched] = await enrichPosts(supabase, user!.id, [data as SocialPostRow]);

  if (target.user_id !== user!.id) {
    void notifyUserPush(target.user_id, {
      title: "Nueva respuesta",
      body: `${profile?.display_name ?? "Alguien"}: ${text.slice(0, 80)}`,
      url: `/social?thread=${rootId}`,
    });
  }

  return NextResponse.json(enriched, { status: 201 });
}
