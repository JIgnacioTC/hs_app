import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { areFriends } from "@/lib/social/friends";
import { copyRoutineToUser } from "@/lib/social/copy-routine";
import { getDisplayName, notifyUserPush } from "@/lib/social/push-notify";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { routine_id, friend_id } = await request.json();
  if (!routine_id || !friend_id) return jsonError("routine_id y friend_id requeridos");
  if (friend_id === user!.id) return jsonError("No puedes enviarte rutinas a ti mismo");

  const supabase = await getSupabaseServerClient();

  const friends = await areFriends(supabase, user!.id, friend_id);
  if (!friends) return jsonError("Solo puedes enviar rutinas a tus amigos", 403);

  const { data: routine } = await supabase
    .from("gym_routines")
    .select("id, name")
    .eq("id", routine_id)
    .eq("user_id", user!.id)
    .eq("active", true)
    .single();

  if (!routine) return jsonError("Rutina no encontrada", 404);

  const admin = createAdminClient();
  const senderName = await getDisplayName(user!.id);

  let copied;
  try {
    copied = await copyRoutineToUser(
      admin,
      routine_id,
      user!.id,
      friend_id,
      ` · de ${senderName}`
    );
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "No se pudo copiar la rutina");
  }

  const { data: share, error: shareError } = await admin
    .from("routine_shares")
    .insert({
      from_user_id: user!.id,
      to_user_id: friend_id,
      source_routine_id: routine_id,
      copied_routine_id: copied.id,
      routine_name: routine.name,
    })
    .select("id, created_at")
    .single();

  if (shareError) {
    return NextResponse.json({ error: shareError.message }, { status: 500 });
  }

  void notifyUserPush(friend_id, {
    title: "Rutina recibida",
    body: `${senderName} te envió «${routine.name}»`,
    url: "/social?tab=routines",
  });

  return NextResponse.json({
    ok: true,
    share_id: share.id,
    copied_routine_id: copied.id,
    copied_routine_name: copied.name,
  });
}
