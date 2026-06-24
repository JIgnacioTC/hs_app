import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import { createStarterRoutine } from "@/lib/gym/create-starter-routine";
import {
  STARTER_PLANS,
  TRAINING_FREQUENCY,
  TRAINING_GOALS,
  type TrainingFrequencyId,
  type TrainingGoalId,
} from "@/lib/gym/onboarding";

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const goal = body.goal as TrainingGoalId;
  const frequency = body.frequency as TrainingFrequencyId;
  const createStarter = body.create_starter !== false;

  if (!TRAINING_GOALS.some((g) => g.id === goal)) {
    return jsonError("Objetivo no válido");
  }
  if (!TRAINING_FREQUENCY.some((f) => f.id === frequency)) {
    return jsonError("Frecuencia no válida");
  }

  const supabase = await getSupabaseServerClient();
  const goalLabel = TRAINING_GOALS.find((g) => g.id === goal)?.label ?? goal;
  const freqLabel = TRAINING_FREQUENCY.find((f) => f.id === frequency)?.label ?? frequency;

  let starterRoutine: { id: string; name: string } | null = null;
  if (createStarter) {
    try {
      starterRoutine = await createStarterRoutine(supabase, user!.id, goal);
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : "No se pudo crear el flujo inicial");
    }
  }

  return NextResponse.json({
    ok: true,
    starter_routine: starterRoutine,
    plan_preview: STARTER_PLANS[goal],
    profile: {
      focus_areas: [goalLabel, freqLabel],
    },
  });
}
