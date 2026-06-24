import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAdmin, jsonError } from "@/lib/api-helpers";
import {
  CATALOG_DATASET_HINTS,
  IMPORT_BATCH_SIZE,
  buildDatasetIndex,
  getDatasetTotal,
  getNormalizedDatasetBatch,
  resolveCatalogExercise,
  mediaPayloadFromDatasetId,
  toCatalogMediaPayload,
  toCatalogRow,
} from "@/lib/gym/exercise-dataset/catalog-import";

export const maxDuration = 30;

function getImportClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createAdminClient();
  }
  return null;
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const supabase = getImportClient() ?? (await getSupabaseServerClient());
  const datasetTotal = getDatasetTotal();

  const { data, error: dbError } = await supabase
    .from("exercise_catalog")
    .select("dataset_id")
    .eq("active", true);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const importedIds = new Set(
    (data ?? []).map((row) => row.dataset_id).filter(Boolean) as string[]
  );

  const curatedSlugs = Object.keys(CATALOG_DATASET_HINTS);
  const { data: curated } = await supabase
    .from("exercise_catalog")
    .select("slug, dataset_id, demo_gif_url")
    .in("slug", curatedSlugs)
    .eq("active", true);

  const curatedWithMedia =
    curated?.filter((row) => row.dataset_id && row.demo_gif_url).length ?? 0;

  return NextResponse.json({
    dataset_total: datasetTotal,
    imported: importedIds.size,
    pending: Math.max(0, datasetTotal - importedIds.size),
    curated_total: curatedSlugs.length,
    curated_enriched: curatedWithMedia,
    batch_size: IMPORT_BATCH_SIZE,
    source: "hasaneyldrm/exercises-dataset",
  });
}

export async function POST(request: Request) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json().catch(() => ({}));
    const mode = body.mode === "enrich" ? "enrich" : body.mode === "refresh-media" ? "refresh-media" : "import";
    const syncAll = body.all === true;
    const offset = Math.max(0, Number(body.offset) || 0);
    const limit = Math.min(Math.max(1, Number(body.limit) || IMPORT_BATCH_SIZE), 50);
    const slug = typeof body.slug === "string" ? body.slug : undefined;

    const supabase = getImportClient() ?? (await getSupabaseServerClient());

    if (mode === "enrich") {
      return handleEnrichBatch(supabase, user!.id, { slug, syncAll, offset, limit });
    }

    if (mode === "refresh-media") {
      return handleRefreshMediaBatch(supabase, { offset, limit });
    }

    return handleImportBatch(supabase, user!.id, { offset, limit });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado al importar";
    console.error("exercise import failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleEnrichBatch(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  userId: string,
  opts: { slug?: string; syncAll: boolean; offset: number; limit: number }
) {
  const index = buildDatasetIndex();

  let query = supabase
    .from("exercise_catalog")
    .select("id, slug, muscle_group, dataset_id")
    .eq("active", true)
    .in("slug", Object.keys(CATALOG_DATASET_HINTS))
    .order("slug");

  if (opts.slug) query = query.eq("slug", opts.slug);

  const { data: catalog, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  if (!catalog?.length) return jsonError("Sin ejercicios curados para enriquecer", 404);

  const targets = opts.syncAll ? catalog : catalog.filter((row) => !row.dataset_id);
  const batch = opts.slug ? targets : targets.slice(opts.offset, opts.offset + opts.limit);
  const total = targets.length;
  const done = opts.slug ? true : opts.offset + batch.length >= total;
  const nextOffset = opts.offset + batch.length;

  if (!batch.length) {
    return NextResponse.json({
      ok: true,
      mode: "enrich",
      done: true,
      user_id: userId,
      offset: opts.offset,
      nextOffset: total,
      total,
      updated: 0,
      results: [],
    });
  }

  const usedIds = new Set(
    catalog.map((row) => row.dataset_id).filter(Boolean) as string[]
  );

  const results: Array<{
    slug: string;
    status: "updated" | "skipped" | "not_found";
    dataset_id?: string;
    reason?: string;
  }> = [];

  for (const row of batch) {
    const match = resolveCatalogExercise(row.slug, row.muscle_group, index);
    if (!match) {
      results.push({ slug: row.slug, status: "not_found" });
      continue;
    }

    if (usedIds.has(match.dataset_id) && row.dataset_id !== match.dataset_id) {
      results.push({
        slug: row.slug,
        status: "skipped",
        reason: "ID del dataset ya asignado a otro ejercicio",
      });
      continue;
    }

    const payload = toCatalogMediaPayload(match);
    const { error: updateError } = await supabase
      .from("exercise_catalog")
      .update(payload)
      .eq("id", row.id);

    if (updateError) {
      results.push({ slug: row.slug, status: "skipped", reason: updateError.message });
      continue;
    }

    usedIds.add(match.dataset_id);
    results.push({ slug: row.slug, status: "updated", dataset_id: match.dataset_id });
  }

  return NextResponse.json({
    ok: true,
    mode: "enrich",
    done,
    user_id: userId,
    offset: opts.offset,
    nextOffset,
    total,
    batch_size: batch.length,
    updated: results.filter((r) => r.status === "updated").length,
    results,
  });
}

async function handleRefreshMediaBatch(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  opts: { offset: number; limit: number }
) {
  const { count } = await supabase
    .from("exercise_catalog")
    .select("id", { count: "exact", head: true })
    .eq("active", true)
    .not("dataset_id", "is", null);

  const total = count ?? 0;

  const { data: rows, error: dbError } = await supabase
    .from("exercise_catalog")
    .select("id, dataset_id, slug")
    .eq("active", true)
    .not("dataset_id", "is", null)
    .order("dataset_id")
    .range(opts.offset, opts.offset + opts.limit - 1);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  const results: Array<{ slug?: string; dataset_id: string; status: string; reason?: string }> = [];

  for (const row of rows ?? []) {
    const payload = mediaPayloadFromDatasetId(row.dataset_id);
    if (!payload) {
      results.push({
        dataset_id: row.dataset_id,
        status: "skipped",
        reason: "Sin entrada en dataset local",
      });
      continue;
    }

    const { error: updateError } = await supabase
      .from("exercise_catalog")
      .update(payload)
      .eq("id", row.id);

    results.push({
      slug: row.slug,
      dataset_id: row.dataset_id,
      status: updateError ? "skipped" : "updated",
      reason: updateError?.message,
    });
  }

  const batchLen = rows?.length ?? 0;
  const nextOffset = opts.offset + batchLen;
  const done = nextOffset >= total || batchLen === 0;

  return NextResponse.json({
    ok: true,
    mode: "refresh-media",
    done,
    offset: opts.offset,
    nextOffset,
    total,
    batch_size: batchLen,
    updated: results.filter((r) => r.status === "updated").length,
    results,
  });
}

async function handleImportBatch(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  userId: string,
  opts: { offset: number; limit: number }
) {
  const datasetTotal = getDatasetTotal();
  const batch = getNormalizedDatasetBatch(opts.offset, opts.limit);
  const done = opts.offset + batch.length >= datasetTotal;
  const nextOffset = opts.offset + batch.length;

  const results: Array<{
    dataset_id: string;
    slug: string;
    status: "inserted" | "updated" | "skipped";
    reason?: string;
  }> = [];

  for (const exercise of batch) {
    const row = toCatalogRow(exercise);

    const { data: existing } = await supabase
      .from("exercise_catalog")
      .select("id, slug")
      .eq("dataset_id", exercise.dataset_id)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from("exercise_catalog")
        .update(row)
        .eq("id", existing.id);

      results.push({
        dataset_id: exercise.dataset_id,
        slug: exercise.slug,
        status: updateError ? "skipped" : "updated",
        reason: updateError?.message,
      });
      continue;
    }

    const { error: insertError } = await supabase.from("exercise_catalog").insert(row);

    if (insertError?.code === "23505") {
      const { error: upsertError } = await supabase
        .from("exercise_catalog")
        .update(row)
        .eq("slug", exercise.slug);

      results.push({
        dataset_id: exercise.dataset_id,
        slug: exercise.slug,
        status: upsertError ? "skipped" : "updated",
        reason: upsertError?.message,
      });
      continue;
    }

    results.push({
      dataset_id: exercise.dataset_id,
      slug: exercise.slug,
      status: insertError ? "skipped" : "inserted",
      reason: insertError?.message,
    });
  }

  return NextResponse.json({
    ok: true,
    mode: "import",
    done,
    user_id: userId,
    offset: opts.offset,
    nextOffset,
    total: datasetTotal,
    batch_size: batch.length,
    imported: results.filter((r) => r.status === "inserted" || r.status === "updated").length,
    results,
  });
}
