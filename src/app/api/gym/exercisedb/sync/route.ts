import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAdmin, jsonError } from "@/lib/api-helpers";
import {
  CATALOG_EXERCISEDB_HINTS,
  SYNC_BATCH_SIZE,
  getBodyPartForSlug,
  loadCacheForBodyParts,
  resolveCatalogExercise,
  toCatalogEnrichment,
} from "@/lib/gym/exercisedb/catalog-sync";

export const maxDuration = 30;

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
    batch_size: SYNC_BATCH_SIZE,
  });
}

export async function POST(request: Request) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json().catch(() => ({}));
    const slug = typeof body.slug === "string" ? body.slug : undefined;
    const syncAll = body.all === true;
    const offset = Math.max(0, Number(body.offset) || 0);
    const limit = Math.min(Math.max(1, Number(body.limit) || SYNC_BATCH_SIZE), 8);

    const supabase = getSyncClient() ?? (await getSupabaseServerClient());

    let query = supabase
      .from("exercise_catalog")
      .select("id, slug, muscle_group, exercisedb_id")
      .eq("active", true)
      .order("slug");
    if (slug) query = query.eq("slug", slug);

    const { data: catalog, error: dbError } = await query;
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    if (!catalog?.length) return jsonError("Sin ejercicios para sincronizar", 404);

    const targets = syncAll ? catalog : catalog.filter((row) => !row.exercisedb_id);
    const batch = slug ? targets : targets.slice(offset, offset + limit);
    const total = targets.length;
    const done = slug ? true : offset + batch.length >= total;
    const nextOffset = offset + batch.length;

    if (!batch.length) {
      return NextResponse.json({
        ok: true,
        done: true,
        user_id: user!.id,
        offset,
        nextOffset: total,
        total,
        synced: 0,
        results: [],
      });
    }

    const bodyPartsNeeded = new Set<string>();
    for (const row of batch) {
      const hint = CATALOG_EXERCISEDB_HINTS[row.slug];
      if (hint?.exactId) continue;
      const bodyPart = getBodyPartForSlug(row.slug, row.muscle_group);
      if (bodyPart) bodyPartsNeeded.add(bodyPart);
    }

    let cache: Awaited<ReturnType<typeof loadCacheForBodyParts>> = [];
    if (bodyPartsNeeded.size > 0) {
      try {
        cache = await loadCacheForBodyParts([...bodyPartsNeeded]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo conectar con ExerciseDB";
        return NextResponse.json(
          {
            error: `ExerciseDB no disponible: ${message}. Usa oss.exercisedb.dev (elimina EXERCISEDB_API_KEY si no tienes plan RapidAPI).`,
          },
          { status: 502 }
        );
      }
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

    for (const row of batch) {
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
      done,
      user_id: user!.id,
      offset,
      nextOffset,
      total,
      batch_size: batch.length,
      cache_size: cache.length,
      synced: results.filter((r) => r.status === "updated").length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado al sincronizar";
    console.error("exercise sync failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
