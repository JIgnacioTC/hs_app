import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction") ?? "received";

  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("routine_shares")
    .select(
      "id, from_user_id, to_user_id, source_routine_id, copied_routine_id, routine_name, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(40);

  if (direction === "sent") {
    query = query.eq("from_user_id", user!.id);
  } else {
    query = query.eq("to_user_id", user!.id);
  }

  const { data: shares, error: sharesError } = await query;

  if (sharesError) {
    return NextResponse.json({ error: sharesError.message }, { status: 500 });
  }

  if (!shares?.length) {
    return NextResponse.json([]);
  }

  const userIds = [
    ...new Set(
      shares.flatMap((s) =>
        direction === "sent" ? [s.to_user_id] : [s.from_user_id]
      )
    ),
  ];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  return NextResponse.json(
    shares.map((share) => ({
      ...share,
      peer_name:
        direction === "sent"
          ? nameMap.get(share.to_user_id) ?? "Amigo"
          : nameMap.get(share.from_user_id) ?? "Amigo",
    }))
  );
}
