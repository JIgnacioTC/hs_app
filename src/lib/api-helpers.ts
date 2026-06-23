import { NextResponse } from "next/server";
import { getSession } from "@/utils/supabase/server";
import { isAdminUser } from "@/lib/admin";

export async function requireAuth() {
  const user = await getSession();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, error: null };
}

export async function requireAdmin() {
  const { user, error } = await requireAuth();
  if (error) return { user: null, error };

  if (!isAdminUser(user)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Acceso de administrador requerido" }, { status: 403 }),
    };
  }

  return { user, error: null };
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
