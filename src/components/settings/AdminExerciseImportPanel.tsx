"use client";

import { useCallback, useEffect, useState } from "react";
import { Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface ImportStats {
  dataset_total: number;
  imported: number;
  pending: number;
  curated_total: number;
  curated_enriched: number;
  batch_size?: number;
  source?: string;
}

interface ImportResultItem {
  slug?: string;
  dataset_id?: string;
  status: string;
  reason?: string;
}

interface ImportBatchResponse {
  ok: boolean;
  done: boolean;
  mode: "enrich" | "import" | "refresh-media";
  offset: number;
  nextOffset: number;
  total: number;
  updated?: number;
  imported?: number;
  results: ImportResultItem[];
}

export function AdminExerciseImportPanel() {
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [importing, setImporting] = useState(false);
  const [forceEnrich, setForceEnrich] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"enrich" | "import" | null>(null);
  const [lastRun, setLastRun] = useState<{ updated: number; results: ImportResultItem[] } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    setError(null);
    try {
      const data = await api.get<ImportStats>("/api/gym/exercise-dataset/import");
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las estadísticas");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  async function runBatch(
    mode: "enrich" | "import",
    offset: number,
    batchSize: number,
    all?: boolean
  ): Promise<ImportBatchResponse> {
    return api.post<ImportBatchResponse>("/api/gym/exercise-dataset/import", {
      mode,
      offset,
      limit: batchSize,
      all: all ?? false,
    });
  }

  async function refreshMediaUrls() {
    setImporting(true);
    setError(null);
    setProgress(0);
    setPhase("import");

    const batchSize = 50;
    let offset = 0;
    let done = false;
    let totalUpdated = 0;

    try {
      while (!done) {
        const result = await api.post<ImportBatchResponse>("/api/gym/exercise-dataset/import", {
          mode: "refresh-media",
          offset,
          limit: batchSize,
        });
        totalUpdated += result.updated ?? 0;
        offset = result.nextOffset;
        done = result.done;
        setProgress(result.total > 0 ? offset / result.total : 1);
      }
      setLastRun({ updated: totalUpdated, results: [] });
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al refrescar media");
    } finally {
      setImporting(false);
      setProgress(0);
      setPhase(null);
    }
  }

  async function runImport() {
    setImporting(true);
    setError(null);
    setProgress(0);

    const batchSize = stats?.batch_size ?? 25;
    let totalUpdated = 0;
    const allResults: ImportResultItem[] = [];

    try {
      setPhase("enrich");
      let enrichOffset = 0;
      let enrichDone = false;

      while (!enrichDone) {
        const result = await runBatch("enrich", enrichOffset, batchSize, forceEnrich);
        allResults.push(...result.results);
        totalUpdated += result.updated ?? 0;
        enrichOffset = result.nextOffset;
        enrichDone = result.done;
        setProgress(result.total > 0 ? Math.min(0.15, (enrichOffset / result.total) * 0.15) : 0.15);
      }

      setPhase("import");
      let importOffset = 0;
      let importDone = false;
      const importTotal = stats?.dataset_total ?? 1324;

      while (!importDone) {
        const result = await runBatch("import", importOffset, batchSize);
        allResults.push(...result.results);
        totalUpdated += result.imported ?? 0;
        importOffset = result.nextOffset;
        importDone = result.done;
        setProgress(0.15 + (importTotal > 0 ? (importOffset / importTotal) * 0.85 : 0.85));
      }

      setLastRun({ updated: totalUpdated, results: allResults });
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
      if (allResults.length > 0) {
        setLastRun({ updated: totalUpdated, results: allResults });
      }
    } finally {
      setImporting(false);
      setProgress(0);
      setPhase(null);
    }
  }

  const notFound =
    lastRun?.results.filter((r) => r.status === "not_found" && r.slug).map((r) => r.slug!) ?? [];

  return (
    <section className="space-y-4">
      <div>
        <p className="grok-label mb-1">Catálogo de ejercicios</p>
        <p className="text-sm text-secondary">
          Dataset local (1.324 ejercicios). Los GIFs se sirven solo desde Cloudflare R2; las
          imágenes estáticas usan CDN. Enriquece los curados en español e importa el resto del
          catálogo.
        </p>
      </div>

      <Card className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-border bg-surface-muted p-3">
            <Database size={20} className="text-accent" />
          </div>
          <div className="flex-1">
            <p className="font-medium tracking-tight">Estado del catálogo</p>
            {loadingStats ? (
              <p className="mt-1 text-sm text-muted">Cargando…</p>
            ) : stats ? (
              <>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                  <Stat label="Dataset" value={stats.dataset_total} />
                  <Stat label="Importados" value={stats.imported} accent />
                  <Stat label="Pendientes" value={stats.pending} />
                  <Stat label="Curados c/media" value={stats.curated_enriched} />
                </div>
                {stats.source && (
                  <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-muted">
                    Fuente: {stats.source}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm text-muted">Sin datos</p>
            )}
          </div>
        </div>

        {importing && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>
                {phase === "enrich" ? "Enriqueciendo curados…" : "Importando catálogo…"}
              </span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setForceEnrich((value) => !value)}
          disabled={importing}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
            forceEnrich ? "border-accent-soft bg-accent/10" : "border-border bg-surface-muted"
          )}
        >
          <span
            className={cn(
              "h-4 w-4 shrink-0 rounded border",
              forceEnrich ? "border-accent bg-accent" : "border-border bg-surface"
            )}
          />
          <span className="text-secondary">
            Forzar re-enriquecimiento de ejercicios curados (incluso los ya vinculados)
          </span>
        </button>

        <Button
          size="lg"
          className="w-full gap-2"
          onClick={runImport}
          disabled={importing || loadingStats}
        >
          <RefreshCw size={18} className={cn(importing && "animate-spin")} />
          {importing ? "Importando…" : "Importar catálogo completo"}
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={refreshMediaUrls}
          disabled={importing || loadingStats}
        >
          Refrescar URLs de media en catálogo
        </Button>

        {error && <p className="text-sm text-danger">{error}</p>}

        {lastRun && (
          <div className="rounded-xl border border-border bg-surface-muted p-3 text-sm">
            <p className="font-medium text-secondary">
              Última importación: {lastRun.updated} registros procesados
            </p>
            {notFound.length > 0 && (
              <p className="mt-2 text-xs text-muted">
                Sin coincidencia en dataset: {notFound.join(", ")}
              </p>
            )}
          </div>
        )}
      </Card>
    </section>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface-muted px-2 py-2">
      <p
        className={cn(
          "font-mono text-lg font-semibold",
          accent ? "text-accent" : "text-secondary"
        )}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}
