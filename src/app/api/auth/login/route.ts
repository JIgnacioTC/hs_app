import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { jsonError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return jsonError("Email y contraseña requeridos");
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return jsonError(error.message, 401);
  }

  return NextResponse.json({ user: data.user });
}
