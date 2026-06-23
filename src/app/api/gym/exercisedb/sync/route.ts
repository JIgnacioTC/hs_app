import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAdmin, jsonError } from "@/lib/api-helpers";
import {
  loadExerciseDbCache,
  resolveCatalogExercise,
  toCatalogEnrichment,
} from "@/lib/gym/exercisedb/catalog-sync";

export const maxDuration = 60;

function getSyncClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createAdminClient();
  }
  return null;
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const supabase = getSyncClient() ?? (await getSupabaseServerClient());
  const { data, error: dbError } = await supabase
    .from("exercise_catalog")
    .select("exercisedb_id")
    .eq("active", true);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const total = data?.length ?? 0;
  const synced = data?.filter((row) => row.exercisedb_id).length ?? 0;

  return NextResponse.json({
    total,
    synced,
    pending: total - synced,
  });
}

export async function POST(request: Request) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json().catch(() => ({}));
    const slug = typeof body.slug === "string" ? body.slug : undefined;
    const syncAll = body.all === true;

    const supabase = getSyncClient() ?? (await getSupabaseServerClient());
    if (!getSyncClient()) {
      console.warn(
        "SUPABASE_SERVICE_ROLE_KEY not set — catalog sync may fail due to RLS on exercise_catalog"
      );
    }

    let query = supabase
      .from("exercise_catalog")
      .select("id, slug, muscle_group, exercisedb_id")
      .eq("active", true);
    if (slug) query = query.eq("slug", slug);

    const { data: catalog, error: dbError } = await query;
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    if (!catalog?.length) return jsonError("Sin ejercicios para sincronizar", 404);

    const targets = syncAll ? catalog : catalog.filter((row) => !row.exercisedb_id);

    let cache;
    try {
      cache = await loadExerciseDbCache();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo conectar con ExerciseDB";
      return NextResponse.json(
        {
          error: `ExerciseDB no disponible: ${message}. Comprueba EXERCISEDB_FALLBACK_URL o tu API key.`,
        },
        { status: 502 }
      );
    }

    if (!cache.length) {
      return jsonError("ExerciseDB devolvió un catálogo vacío", 502);
    }

    const usedIds = new Set(
      catalog.map((row) => row.exercisedb_id).filter(Boolean) as string[]
    );

    const results: Array<{
      slug: string;
      status: "updated" | "skipped" | "not_found";
      exercisedb_id?: string;
      reason?: string;
    }> = [];

    for (const row of targets) {
      const match = await resolveCatalogExercise(row.slug, row.muscle_group, cache);
      if (!match) {
        results.push({ slug: row.slug, status: "not_found" });
        continue;
      }

      if (usedIds.has(match.exercisedb_id) && row.exercisedb_id !== match.exercisedb_id) {
        results.push({
          slug: row.slug,
          status: "skipped",
          reason: "ID de ExerciseDB ya asignado a otro ejercicio",
        });
        continue;
      }

      const enrichment = toCatalogEnrichment(match);
      const { error: updateError } = await supabase
        .from("exercise_catalog")
        .update(enrichment)
        .eq("id", row.id);

      if (updateError) {
        results.push({
          slug: row.slug,
          status: "skipped",
          reason: updateError.message,
        });
        continue;
      }

      usedIds.add(match.exercisedb_id);
      results.push({
        slug: row.slug,
        status: "updated",
        exercisedb_id: match.exercisedb_id,
      });
    }

    return NextResponse.json({
      ok: true,
      user_id: user!.id,
      synced: results.filter((r) => r.status === "updated").length,
      cache_size: cache.length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado al sincronizar";
    console.error("exercise sync failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
