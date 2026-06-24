"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudUpload, FolderUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface GifBucketStats {
  configured: boolean;
  public_url_configured: boolean;
  bucket: string;
  public_url?: string | null;
  bucket_gifs: number;
  dataset_gifs: number;
  missing: number;
  sample_keys?: string[];
}

interface PresignUpload {
  key: string;
  uploadUrl: string;
  publicUrl: string | null;
  contentType: string;
}

interface PresignResponse {
  ok: boolean;
  bucket: string;
  uploads: PresignUpload[];
  rejected: Array<{ name: string; reason: string }>;
}

interface UploadProgress {
  total: number;
  done: number;
  failed: number;
  skipped: number;
}

const BATCH_SIZE = 25;
const GIF_PATTERN = /^\d{4}-.+\.gif$/i;

type FileInput = HTMLInputElement & {
  files?: FileList | null;
  click?: () => void;
};

export function AdminExerciseGifUploadPanel() {
  const fileInputRef = useRef<FileInput>(null);
  const folderInputRef = useRef<FileInput>(null);

  const [stats, setStats] = useState<GifBucketStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    setError(null);
    try {
      const data = await api.get<GifBucketStats>("/api/admin/exercise-gifs");
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el estado del bucket");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) => GIF_PATTERN.test(file.name));

    if (files.length === 0) {
      setError("No hay archivos .gif válidos (formato esperado: 0001-abc123.gif)");
      return;
    }

    setUploading(true);
    setError(null);
    setLastMessage(null);
    setProgress({ total: files.length, done: 0, failed: 0, skipped: 0 });

    let done = 0;
    let failed = 0;
    let skipped = 0;

    try {
      for (let offset = 0; offset < files.length; offset += BATCH_SIZE) {
        const batch = files.slice(offset, offset + BATCH_SIZE);
        const presign = await api.post<PresignResponse>("/api/admin/exercise-gifs", {
          files: batch.map((file) => ({
            name: file.name,
            contentType: file.type || "image/gif",
          })),
        });

        skipped += presign.rejected.length;

        const uploadByKey = new Map(presign.uploads.map((item) => [item.key, item]));

        const results = await Promise.all(
          batch.map(async (file) => {
            const presigned = uploadByKey.get(file.name);
            if (!presigned) return "failed" as const;

            try {
              const response = await fetch(presigned.uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": presigned.contentType },
              });
              return response.ok ? ("ok" as const) : ("failed" as const);
            } catch {
              return "failed" as const;
            }
          })
        );

        for (const result of results) {
          if (result === "ok") done += 1;
          else failed += 1;
        }

        setProgress({
          total: files.length,
          done,
          failed,
          skipped,
        });
      }

      setLastMessage(
        `Subida completada: ${done} OK, ${failed} fallidos, ${skipped} omitidos por nombre inválido.`
      );
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error durante la subida");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  function handleFileInput(input: FileInput | null) {
    const files = input?.files;
    if (files?.length) {
      void uploadFiles(files);
    }
    if (input) input.value = "";
  }

  const progressRatio =
    progress && progress.total > 0
      ? (progress.done + progress.failed + progress.skipped) / progress.total
      : 0;

  return (
    <section className="space-y-4">
      <div>
        <p className="grok-label mb-1">GIFs en Cloudflare R2</p>
        <p className="text-sm text-secondary">
          Sube los GIFs del dataset al bucket <code className="text-accent-soft">hs-gifs</code>.
          Los ejercicios los servirán desde R2 cuando configures{" "}
          <code className="text-accent-soft">NEXT_PUBLIC_R2_GIF_PUBLIC_URL</code> en Vercel.
        </p>
      </div>

      <Card className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-border bg-surface-muted p-3">
            <CloudUpload size={20} className="text-accent" />
          </div>
          <div className="flex-1">
            <p className="font-medium tracking-tight">Estado del bucket</p>
            {loadingStats ? (
              <p className="mt-1 text-sm text-muted">Cargando…</p>
            ) : stats ? (
              <>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                  <Stat label="En bucket" value={stats.bucket_gifs} accent />
                  <Stat label="En dataset" value={stats.dataset_gifs} />
                  <Stat label="Pendientes" value={stats.missing} />
                  <Stat
                    label="R2 API"
                    value={stats.configured ? 1 : 0}
                    text={stats.configured ? "OK" : "No"}
                  />
                </div>
                <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-muted">
                  Bucket: {stats.bucket}
                  {stats.public_url ? ` · ${stats.public_url}` : " · sin URL pública"}
                </p>
                {!stats.configured && (
                  <p className="mt-2 text-xs text-danger">
                    Faltan credenciales R2 en el servidor (R2_ENDPOINT, R2_ACCESS_KEY_ID,
                    R2_SECRET_ACCESS_KEY).
                  </p>
                )}
                {stats.configured && !stats.public_url_configured && (
                  <p className="mt-2 text-xs text-danger">
                    Añade NEXT_PUBLIC_R2_GIF_PUBLIC_URL para que la app sirva los GIFs desde R2.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm text-muted">Sin datos</p>
            )}
          </div>
        </div>

        {uploading && progress && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>Subiendo GIFs a R2…</span>
              <span>
                {progress.done + progress.failed + progress.skipped}/{progress.total}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${Math.round(progressRatio * 100)}%` }}
              />
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".gif,image/gif"
          multiple
          className="hidden"
          onChange={() => handleFileInput(fileInputRef.current)}
        />
        <input
          ref={folderInputRef}
          type="file"
          accept=".gif,image/gif"
          multiple
          className="hidden"
          onChange={() => handleFileInput(folderInputRef.current)}
          // @ts-expect-error webkitdirectory is non-standard but supported for folder upload
          webkitdirectory=""
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => fileInputRef.current?.click?.()}
            disabled={uploading || loadingStats || !stats?.configured}
          >
            <CloudUpload size={18} className={cn(uploading && "animate-pulse")} />
            {uploading ? "Subiendo…" : "Seleccionar GIFs"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => folderInputRef.current?.click?.()}
            disabled={uploading || loadingStats || !stats?.configured}
          >
            <FolderUp size={18} />
            Carpeta de GIFs
          </Button>
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full gap-2"
          onClick={loadStats}
          disabled={uploading || loadingStats}
        >
          <RefreshCw size={18} className={cn(loadingStats && "animate-spin")} />
          Actualizar estado
        </Button>

        <p className="text-xs text-muted">
          Los archivos deben llamarse como en el dataset (ej.{" "}
          <code className="text-accent-soft">0001-2gPfomN.gif</code>). La subida usa URLs
          prefirmadas: las credenciales R2 nunca salen del servidor.
        </p>

        {error && <p className="text-sm text-danger">{error}</p>}
        {lastMessage && <p className="text-sm text-secondary">{lastMessage}</p>}
      </Card>
    </section>
  );
}

function Stat({
  label,
  value,
  text,
  accent = false,
}: {
  label: string;
  value: number;
  text?: string;
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
        {text ?? value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}
