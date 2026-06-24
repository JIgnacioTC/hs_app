import { NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/api-helpers";
import { getDatasetTotal } from "@/lib/gym/exercise-dataset/catalog-import";
import {
  createGifPresignedUploadUrl,
  getR2BucketName,
  getR2PublicBaseUrl,
  isR2Configured,
  listBucketGifKeys,
  normalizeGifFilename,
} from "@/lib/gym/exercise-dataset/r2";

const MAX_PRESIGN_BATCH = 50;

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const configured = isR2Configured();
  const publicUrl = getR2PublicBaseUrl();
  const datasetGifs = getDatasetTotal();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      public_url_configured: !!publicUrl,
      bucket: getR2BucketName(),
      bucket_gifs: 0,
      dataset_gifs: datasetGifs,
      missing: datasetGifs,
    });
  }

  try {
    const keys = await listBucketGifKeys();
    return NextResponse.json({
      configured: true,
      public_url_configured: !!publicUrl,
      bucket: getR2BucketName(),
      public_url: publicUrl,
      bucket_gifs: keys.length,
      dataset_gifs: datasetGifs,
      missing: Math.max(0, datasetGifs - keys.length),
      sample_keys: keys.slice(0, 5),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al leer el bucket R2";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isR2Configured()) {
    return jsonError(
      "R2 no configurado. Añade R2_ENDPOINT, R2_ACCESS_KEY_ID y R2_SECRET_ACCESS_KEY en Vercel.",
      503
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const files = Array.isArray(body.files) ? body.files : [];

    if (files.length === 0) {
      return jsonError("Indica al menos un archivo en files[]");
    }

    if (files.length > MAX_PRESIGN_BATCH) {
      return jsonError(`Máximo ${MAX_PRESIGN_BATCH} archivos por lote`);
    }

    const uploads: Array<{
      key: string;
      uploadUrl: string;
      publicUrl: string | null;
      contentType: string;
    }> = [];
    const rejected: Array<{ name: string; reason: string }> = [];

    for (const entry of files) {
      const rawName = typeof entry?.name === "string" ? entry.name : "";
      const key = normalizeGifFilename(rawName);

      if (!key) {
        rejected.push({
          name: rawName || "(sin nombre)",
          reason: "Nombre inválido. Usa el formato 0001-abc123.gif",
        });
        continue;
      }

      const contentType =
        typeof entry?.contentType === "string" && entry.contentType.startsWith("image/")
          ? entry.contentType
          : "image/gif";

      const uploadUrl = await createGifPresignedUploadUrl(key, contentType);
      const publicBase = getR2PublicBaseUrl();

      uploads.push({
        key,
        uploadUrl,
        publicUrl: publicBase ? `${publicBase}/${key}` : null,
        contentType,
      });
    }

    return NextResponse.json({
      ok: true,
      bucket: getR2BucketName(),
      uploads,
      rejected,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al generar URLs prefirmadas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
