import {
  mapMuscleGroupToBodyPart,
  normalizeExerciseDbExercise,
} from "@/lib/gym/exercisedb/normalize";
import type {
  ExerciseDbItemResponse,
  ExerciseDbListResponse,
  ExerciseDbNamedItem,
  ExerciseDbQuery,
  ExerciseDbRawExercise,
  NormalizedExerciseDbExercise,
} from "@/lib/gym/exercisedb/types";

const V2_BASE_URL =
  process.env.EXERCISEDB_API_URL?.replace(/\/$/, "") ?? "https://v2.exercisedb.dev";
const OSS_BASE_URL =
  process.env.EXERCISEDB_FALLBACK_URL?.replace(/\/$/, "") ?? "https://oss.exercisedb.dev";

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
const MAX_RETRIES = 4;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldUseV2(): boolean {
  return process.env.EXERCISEDB_USE_V2 === "true" && Boolean(process.env.EXERCISEDB_API_KEY);
}

function resolveBases(preferOss = false): string[] {
  if (preferOss || !shouldUseV2()) {
    return shouldUseV2() ? [OSS_BASE_URL, V2_BASE_URL] : [OSS_BASE_URL];
  }
  return [V2_BASE_URL, OSS_BASE_URL];
}

function buildHeaders(forV2: boolean): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "HS-Gym/1.0",
  };

  if (forV2 && process.env.EXERCISEDB_API_KEY) {
    headers["X-RapidAPI-Key"] = process.env.EXERCISEDB_API_KEY;
    headers["X-RapidAPI-Host"] =
      process.env.EXERCISEDB_RAPIDAPI_HOST ??
      "edb-with-videos-and-images-by-ascendapi.p.rapidapi.com";
  }

  return headers;
}

function isJsonResponse(contentType: string | null): boolean {
  return Boolean(contentType?.includes("application/json"));
}

async function fetchExerciseDb<T>(
  path: string,
  options?: { baseUrl?: string; preferOss?: boolean }
): Promise<T> {
  const bases = options?.baseUrl ? [options.baseUrl] : resolveBases(options?.preferOss);

  let lastError: Error | null = null;

  for (const base of bases) {
    const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const forV2 = base === V2_BASE_URL;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(url, {
          headers: buildHeaders(forV2),
          cache: "no-store",
        });

        const contentType = res.headers.get("content-type");

        if (RETRYABLE_STATUSES.has(res.status)) {
          lastError = new Error(`ExerciseDB ${res.status} at ${base}`);
          const delay = 800 * 2 ** attempt;
          await sleep(delay);
          continue;
        }

        if (!res.ok || !isJsonResponse(contentType)) {
          lastError = new Error(`ExerciseDB ${res.status} at ${base}`);
          break;
        }

        return (await res.json()) as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < MAX_RETRIES - 1) {
          await sleep(800 * 2 ** attempt);
        }
      }
    }
  }

  throw lastError ?? new Error("ExerciseDB request failed");
}

function buildQuery(params: ExerciseDbQuery): string {
  const search = new URLSearchParams();
  if (params.bodyParts) search.set("bodyParts", params.bodyParts);
  if (params.targetMuscles) search.set("targetMuscles", params.targetMuscles);
  if (params.equipments) search.set("equipments", params.equipments);
  if (params.exerciseType) search.set("exerciseType", params.exerciseType);
  if (params.search) search.set("search", params.search);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.cursor) search.set("cursor", params.cursor);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listExerciseDbExercises(
  query: ExerciseDbQuery = {},
  options?: { preferOss?: boolean }
): Promise<{ exercises: NormalizedExerciseDbExercise[]; meta?: ExerciseDbListResponse<ExerciseDbRawExercise>["meta"] }> {
  const response = await fetchExerciseDb<ExerciseDbListResponse<ExerciseDbRawExercise>>(
    `/api/v1/exercises${buildQuery(query)}`,
    options
  );

  return {
    exercises: (response.data ?? []).map(normalizeExerciseDbExercise),
    meta: response.meta,
  };
}

export async function getExerciseDbExercise(
  exerciseId: string,
  options?: { preferOss?: boolean }
): Promise<NormalizedExerciseDbExercise | null> {
  try {
    const response = await fetchExerciseDb<ExerciseDbItemResponse<ExerciseDbRawExercise>>(
      `/api/v1/exercises/${encodeURIComponent(exerciseId)}`,
      options
    );
    if (!response.data) return null;
    return normalizeExerciseDbExercise(response.data);
  } catch {
    return null;
  }
}

export async function listExerciseDbBodyParts(): Promise<ExerciseDbNamedItem[]> {
  const response = await fetchExerciseDb<ExerciseDbListResponse<ExerciseDbNamedItem>>(
    "/api/v1/bodyparts",
    { preferOss: true }
  );
  return response.data ?? [];
}

export async function listExerciseDbMuscles(): Promise<ExerciseDbNamedItem[]> {
  const response = await fetchExerciseDb<ExerciseDbListResponse<ExerciseDbNamedItem>>(
    "/api/v1/muscles",
    { preferOss: true }
  );
  return response.data ?? [];
}

export async function listExerciseDbEquipments(): Promise<ExerciseDbNamedItem[]> {
  const response = await fetchExerciseDb<ExerciseDbListResponse<ExerciseDbNamedItem>>(
    "/api/v1/equipments",
    { preferOss: true }
  );
  return response.data ?? [];
}

export async function searchExerciseDbByMuscleGroup(
  muscleGroup: string,
  limit = 50
): Promise<NormalizedExerciseDbExercise[]> {
  const bodyPart = mapMuscleGroupToBodyPart(muscleGroup);
  if (!bodyPart) return [];
  const { exercises } = await listExerciseDbExercises({ bodyParts: bodyPart, limit }, { preferOss: true });
  return exercises;
}

/** Fetch all exercises for one body part (paginated, OSS, throttled). */
export async function fetchExercisesByBodyPart(
  bodyPart: string
): Promise<NormalizedExerciseDbExercise[]> {
  const all: NormalizedExerciseDbExercise[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 5; page++) {
    const { exercises, meta } = await listExerciseDbExercises(
      { bodyParts: bodyPart, limit: 100, cursor },
      { preferOss: true }
    );
    all.push(...exercises);
    if (!meta?.hasNextPage || !meta.nextCursor) break;
    cursor = meta.nextCursor;
    await sleep(500);
  }

  return all;
}

export async function findExerciseDbMatch(
  searchTerms: string[],
  bodyPart?: string,
  pool?: NormalizedExerciseDbExercise[]
): Promise<NormalizedExerciseDbExercise | null> {
  const tryMatch = (source: NormalizedExerciseDbExercise[]) => {
    for (const term of searchTerms) {
      const exact = source.find((e) => e.name.toLowerCase() === term.toLowerCase());
      if (exact) return exact;

      const partial = source.find((e) => e.name.toLowerCase().includes(term.toLowerCase()));
      if (partial) return partial;
    }
    return null;
  };

  if (pool && pool.length > 0) {
    const hit = tryMatch(pool);
    if (hit) return hit;
  }

  if (bodyPart) {
    const exercises = await fetchExercisesByBodyPart(bodyPart);
    const hit = tryMatch(exercises);
    if (hit) return hit;
  }

  return null;
}

export function getExerciseDbOssBaseUrl() {
  return OSS_BASE_URL;
}
