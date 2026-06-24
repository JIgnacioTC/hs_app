import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import {
  buildFitnessInsights,
  normalizeFitnessInput,
  type FitnessProfileInput,
  type UserFitnessProfile,
} from "@/lib/fitness/profile";

const ALLOWED_KEYS = new Set([
  "sex",
  "birth_date",
  "age_years",
  "height_cm",
  "weight_kg",
  "activity_level",
  "training_experience",
]);

function pickInput(body: Record<string, unknown>): FitnessProfileInput {
  const input: FitnessProfileInput = {};
  for (const key of ALLOWED_KEYS) {
    if (key in body) {
      (input as Record<string, unknown>)[key] = body[key];
    }
  }
  return input;
}

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const supabase = await getSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from("user_fitness_profiles")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const profile = (data as UserFitnessProfile | null) ?? null;

  return NextResponse.json({
    profile,
    insights: buildFitnessInsights(profile),
    complete: Boolean(
      profile?.sex &&
        profile.birth_date &&
        profile.height_cm &&
        profile.weight_kg &&
        profile.activity_level &&
        profile.training_experience
    ),
  });
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

  const patch = normalizeFitnessInput(pickInput(body));
  if (!Object.keys(patch).length) {
    return jsonError("No hay campos válidos para actualizar");
  }

  const supabase = await getSupabaseServerClient();

  const { data: existing } = await supabase
    .from("user_fitness_profiles")
    .select("user_id")
    .eq("user_id", user!.id)
    .maybeSingle();

  let data: UserFitnessProfile | null = null;
  let dbError = null;

  if (existing) {
    const result = await supabase
      .from("user_fitness_profiles")
      .update(patch)
      .eq("user_id", user!.id)
      .select("*")
      .single();
    data = result.data as UserFitnessProfile | null;
    dbError = result.error;
  } else {
    const result = await supabase
      .from("user_fitness_profiles")
      .insert({ user_id: user!.id, ...patch })
      .select("*")
      .single();
    data = result.data as UserFitnessProfile | null;
    dbError = result.error;
  }

  if (dbError || !data) {
    return NextResponse.json({ error: dbError?.message ?? "No se pudo guardar" }, { status: 500 });
  }

  return NextResponse.json({
    profile: data,
    insights: buildFitnessInsights(data),
    complete: Boolean(
      data.sex &&
        data.birth_date &&
        data.height_cm &&
        data.weight_kg &&
        data.activity_level &&
        data.training_experience
    ),
  });
}
