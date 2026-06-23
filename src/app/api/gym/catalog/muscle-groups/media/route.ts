import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-helpers";
import { buildMuscleGroupMediaFromDataset } from "@/lib/gym/exercise-dataset/catalog-import";

const MUSCLE_GROUPS = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Brazos",
  "Piernas",
  "Core",
  "Cardio",
  "Movilidad",
] as const;

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const supabase = await getSupabaseServerClient();
  const media: Record<string, string> = {};

  for (const group of MUSCLE_GROUPS) {
    const { data } = await supabase
      .from("exercise_catalog")
      .select("demo_gif_url, image_url")
      .eq("active", true)
      .eq("muscle_group", group)
      .not("demo_gif_url", "is", null)
      .limit(1)
      .maybeSingle();

    const url = data?.demo_gif_url ?? data?.image_url;
    if (url) media[group] = url;
  }

  if (Object.keys(media).length < MUSCLE_GROUPS.length / 2) {
    const fallback = buildMuscleGroupMediaFromDataset();
    for (const group of MUSCLE_GROUPS) {
      if (!media[group] && fallback[group]) media[group] = fallback[group];
    }
  }

  return NextResponse.json(media);
}
