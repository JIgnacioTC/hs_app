import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { jsonError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return jsonError("Correo y contraseña requeridos");
  }

  if (password.length < 6) {
    return jsonError("La contraseña debe tener al menos 6 caracteres");
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { error: createError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (createError) {
      const message =
        createError.message.includes("already been registered") ||
        createError.message.includes("already registered")
          ? "Este correo ya está registrado"
          : createError.message;
      return jsonError(message, 400);
    }
  } else {
    const supabase = await getSupabaseServerClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (signUpError) {
      return jsonError(signUpError.message, 400);
    }
  }

  const supabase = await getSupabaseServerClient();
  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (loginError) {
    return jsonError(
      "Cuenta creada pero no se pudo iniciar sesión. Prueba entrar manualmente.",
      401
    );
  }

  return NextResponse.json({ user: data.user });
}
