import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { enrichPosts, type SocialPostRow } from "@/lib/social/posts";
import { getSocialAdminClient } from "@/lib/social/server-write";

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { body, image_url } = await request.json();
  const text = typeof body === "string" ? body.trim() : "";
  if (!text) return jsonError("Escribe algo para publicar");

  const admin = getSocialAdminClient();
  const { data, error: dbError } = await admin
    .from("social_posts")
    .insert({
      user_id: user!.id,
      kind: "post",
      body: text,
      image_url: typeof image_url === "string" && image_url.trim() ? image_url.trim() : null,
    })
    .select("*")
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const supabase = await getSupabaseServerClient();
  const [enriched] = await enrichPosts(supabase, user!.id, [data as SocialPostRow]);
  return NextResponse.json(enriched, { status: 201 });
}
