import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { jsonError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return jsonError("Email y contraseña requeridos");
  }

  if (password.length < 6) {
    return jsonError("La contraseña debe tener al menos 6 caracteres");
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return jsonError(error.message, 400);
  }

  return NextResponse.json({ user: data.user });
}
