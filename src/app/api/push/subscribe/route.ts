import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { endpoint, keys } = await request.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return jsonError("Suscripción inválida");
  }

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user!.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      { onConflict: "user_id,endpoint" }
    )
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await getSupabaseServerClient();
  const { error: dbError } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user!.id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  });
}
