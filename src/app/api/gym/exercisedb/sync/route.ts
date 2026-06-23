import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { requireAuth, jsonError } from "@/lib/api-helpers";
import {
  resolveCatalogExercise,
  toCatalogEnrichment,
} from "@/lib/gym/exercisedb/catalog-sync";

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug : undefined;
  const syncAll = body.all === true;

  const supabase = await getSupabaseServerClient();

  let query = supabase.from("exercise_catalog").select("id, slug, muscle_group, exercisedb_id").eq("active", true);
  if (slug) query = query.eq("slug", slug);

  const { data: catalog, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  if (!catalog?.length) return jsonError("Sin ejercicios para sincronizar", 404);

  const targets = syncAll ? catalog : catalog.filter((row) => !row.exercisedb_id);
  const results: Array<{ slug: string; status: "updated" | "skipped" | "not_found"; exercisedb_id?: string }> = [];

  for (const row of targets) {
    const match = await resolveCatalogExercise(row.slug, row.muscle_group);
    if (!match) {
      results.push({ slug: row.slug, status: "not_found" });
      continue;
    }

    const enrichment = toCatalogEnrichment(match);
    const { error: updateError } = await supabase
      .from("exercise_catalog")
      .update(enrichment)
      .eq("id", row.id);

    if (updateError) {
      results.push({ slug: row.slug, status: "skipped" });
      continue;
    }

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
    results,
  });
}
