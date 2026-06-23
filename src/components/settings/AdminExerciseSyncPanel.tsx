"use client";

import { useCallback, useEffect, useState } from "react";
import { Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface CatalogSyncStats {
  total: number;
  synced: number;
  pending: number;
  batch_size?: number;
}

interface SyncResultItem {
  slug: string;
  status: "updated" | "skipped" | "not_found";
  exercisedb_id?: string;
  reason?: string;
}

interface SyncBatchResponse {
  ok: boolean;
  done: boolean;
  offset: number;
  nextOffset: number;
  total: number;
  synced: number;
  results: SyncResultItem[];
}

export function AdminExerciseSyncPanel() {
  const [stats, setStats] = useState<CatalogSyncStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncAll, setSyncAll] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastSync, setLastSync] = useState<{ synced: number; results: SyncResultItem[] } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    setError(null);
    try {
      const data = await api.get<CatalogSyncStats>("/api/gym/exercisedb/sync");
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

  async function runSync() {
    setSyncing(true);
    setError(null);
    setProgress(0);

    const batchSize = stats?.batch_size ?? 5;
    let offset = 0;
    let done = false;
    let totalSynced = 0;
    const allResults: SyncResultItem[] = [];

    try {
      while (!done) {
        const result = await api.post<SyncBatchResponse>("/api/gym/exercisedb/sync", {
          all: syncAll,
          offset,
          limit: batchSize,
        });

        allResults.push(...result.results);
        totalSynced += result.synced;
        offset = result.nextOffset;
        done = result.done;
        setProgress(result.total > 0 ? Math.min(1, offset / result.total) : 1);
      }

      setLastSync({ synced: totalSynced, results: allResults });
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al sincronizar");
      if (allResults.length > 0) {
        setLastSync({ synced: totalSynced, results: allResults });
      }
    } finally {
      setSyncing(false);
      setProgress(0);
    }
  }

  const skipped = lastSync?.results.filter((r) => r.status === "skipped") ?? [];
  const notFound = lastSync?.results.filter((r) => r.status === "not_found") ?? [];

  return (
    <section className="space-y-4">
      <div>
        <p className="grok-label mb-1">Catálogo ExerciseDB</p>
        <p className="text-sm text-secondary">
          Vincula ejercicios locales con ExerciseDB para cargar GIFs, imágenes y metadatos de
          músculos. La sync se ejecuta en lotes pequeños para evitar timeouts.
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
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <Stat label="Total" value={stats.total} />
                <Stat label="Sincronizados" value={stats.synced} accent />
                <Stat label="Pendientes" value={stats.pending} />
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted">Sin datos</p>
            )}
          </div>
        </div>

        {syncing && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>Sincronizando…</span>
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
          onClick={() => setSyncAll((value) => !value)}
          disabled={syncing}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
            syncAll ? "border-accent-soft bg-accent/10" : "border-border bg-surface-muted"
          )}
        >
          <span
            className={cn(
              "h-4 w-4 shrink-0 rounded border",
              syncAll ? "border-accent bg-accent" : "border-border bg-surface"
            )}
          />
          <span className="text-secondary">
            Forzar resincronización de todos los ejercicios (incluso los ya vinculados)
          </span>
        </button>

        <Button
          size="lg"
          className="w-full gap-2"
          onClick={runSync}
          disabled={syncing || loadingStats}
        >
          <RefreshCw size={18} className={cn(syncing && "animate-spin")} />
          {syncing ? "Sincronizando…" : "Sincronizar ejercicios"}
        </Button>

        {error && <p className="text-sm text-danger">{error}</p>}

        {lastSync && (
          <div className="rounded-xl border border-border bg-surface-muted p-3 text-sm">
            <p className="font-medium text-secondary">
              Última sincronización: {lastSync.synced} actualizados de {lastSync.results.length}
            </p>
            {skipped.length > 0 && (
              <p className="mt-2 text-xs text-muted">
                Omitidos:{" "}
                {skipped.map((r) => `${r.slug}${r.reason ? ` (${r.reason})` : ""}`).join(", ")}
              </p>
            )}
            {notFound.length > 0 && (
              <p className="mt-2 text-xs text-muted">
                Sin coincidencia en ExerciseDB: {notFound.map((r) => r.slug).join(", ")}
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
