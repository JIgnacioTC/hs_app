import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-helpers";
import {
  buildMuscleGroupMediaFromDataset,
  enrichExerciseCatalogMedia,
} from "@/lib/gym/exercise-dataset/catalog-import";
import { getExerciseMediaProvider } from "@/lib/gym/exercise-dataset/media";

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

  if (getExerciseMediaProvider() === "supabase") {
    return NextResponse.json(buildMuscleGroupMediaFromDataset());
  }

  const supabase = await getSupabaseServerClient();
  const media: Record<string, string> = {};

  for (const group of MUSCLE_GROUPS) {
    const { data } = await supabase
      .from("exercise_catalog")
      .select("dataset_id, demo_gif_url, image_url")
      .eq("active", true)
      .eq("muscle_group", group)
      .not("demo_gif_url", "is", null)
      .limit(1)
      .maybeSingle();

    const enriched = data ? enrichExerciseCatalogMedia(data) : null;
    const url = enriched?.demo_gif_url ?? enriched?.image_url;
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
