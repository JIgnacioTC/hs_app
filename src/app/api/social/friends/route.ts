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

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", friendIds);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json(profiles ?? []);
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { friend_id } = await request.json();
  if (!friend_id) return jsonError("friend_id requerido");
  if (friend_id === user!.id) return jsonError("No puedes añadirte a ti mismo");

  const supabase = await getSupabaseServerClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", friend_id)
    .maybeSingle();

  if (!target) return jsonError("Usuario no encontrado", 404);

  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status")
    .or(
      `and(user_id.eq.${user!.id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user!.id})`
    )
    .maybeSingle();

  if (existing?.status === "accepted") {
    return NextResponse.json({ ok: true, friend: target, already: true });
  }

  if (existing) {
    return jsonError("Ya existe una solicitud o bloqueo con este usuario");
  }

  const { error: insertError } = await supabase.from("friendships").insert({
    user_id: user!.id,
    friend_id,
    status: "accepted",
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, friend: target });
}
