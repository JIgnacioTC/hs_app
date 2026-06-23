import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";

export async function POST() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
