import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";

const PROFILE_PATCH_KEYS = new Set([
  "display_name",
  "timezone",
  "focus_areas",
  "identity_statement",
  "wizard_completed",
]);

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const patch: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (PROFILE_PATCH_KEYS.has(key)) {
      patch[key] = body[key];
    }
  }

  if (!Object.keys(patch).length) {
    return jsonError("No hay campos válidos para actualizar");
  }

  const supabase = await getSupabaseServerClient();

  const { data, error: dbError } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user!.id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const response = NextResponse.json(data);

  if (patch.wizard_completed === true) {
    response.cookies.set("hs_wizard_done", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return response;
}
