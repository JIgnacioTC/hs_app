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

const RAPIDAPI_BASE_URL =
  process.env.EXERCISEDB_RAPIDAPI_URL?.replace(/\/$/, "") ??
  "https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com";
const RAPIDAPI_HOST =
  process.env.EXERCISEDB_RAPIDAPI_HOST ??
  "edb-with-videos-and-images-by-ascendapi.p.rapidapi.com";
const OSS_BASE_URL =
  process.env.EXERCISEDB_FALLBACK_URL?.replace(/\/$/, "") ?? "https://oss.exercisedb.dev";

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
const MAX_RETRIES = 4;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRapidApiConfigured(): boolean {
  return Boolean(process.env.EXERCISEDB_API_KEY?.trim());
}

function resolveBases(preferOss = false): string[] {
  if (isRapidApiConfigured() && !preferOss) {
    return [RAPIDAPI_BASE_URL, OSS_BASE_URL];
  }
  return [OSS_BASE_URL];
}

function isRapidApiBase(base: string): boolean {
  return base === RAPIDAPI_BASE_URL;
}

function buildHeaders(forRapidApi: boolean): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "HS-Gym/1.0",
  };

  if (forRapidApi && isRapidApiConfigured()) {
    headers["x-rapidapi-key"] = process.env.EXERCISEDB_API_KEY!.trim();
    headers["x-rapidapi-host"] = RAPIDAPI_HOST;
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
    const forRapidApi = isRapidApiBase(base);

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(url, {
          headers: buildHeaders(forRapidApi),
          cache: "no-store",
        });

        const contentType = res.headers.get("content-type");

        if (RETRYABLE_STATUSES.has(res.status)) {
          lastError = new Error(`ExerciseDB ${res.status} at ${forRapidApi ? "RapidAPI" : base}`);
          await sleep(800 * 2 ** attempt);
          continue;
        }

        if (!res.ok || !isJsonResponse(contentType)) {
          lastError = new Error(`ExerciseDB ${res.status} at ${forRapidApi ? "RapidAPI" : base}`);
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

function buildQuery(params: ExerciseDbQuery, forRapidApi: boolean): string {
  const search = new URLSearchParams();

  if (forRapidApi) {
    if (params.name) search.set("name", params.name);
    if (params.keywords) search.set("keywords", params.keywords);
    if (params.limit) search.set("limit", String(params.limit));
    if (params.cursor) search.set("cursor", params.cursor);
  } else {
    if (params.bodyParts) search.set("bodyParts", params.bodyParts);
    if (params.targetMuscles) search.set("targetMuscles", params.targetMuscles);
    if (params.equipments) search.set("equipments", params.equipments);
    if (params.exerciseType) search.set("exerciseType", params.exerciseType);
    if (params.search) search.set("search", params.search);
    if (params.limit) search.set("limit", String(params.limit));
    if (params.cursor) search.set("cursor", params.cursor);
  }

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listExerciseDbExercises(
  query: ExerciseDbQuery = {},
  options?: { preferOss?: boolean }
): Promise<{ exercises: NormalizedExerciseDbExercise[]; meta?: ExerciseDbListResponse<ExerciseDbRawExercise>["meta"] }> {
  const useRapid = isRapidApiConfigured() && !options?.preferOss;

  if (useRapid && (query.name || query.keywords)) {
    try {
      const path = `/api/v1/exercises${buildQuery(query, true)}`;
      const response = await fetchExerciseDb<ExerciseDbListResponse<ExerciseDbRawExercise>>(path, {
        baseUrl: RAPIDAPI_BASE_URL,
      });
      return {
        exercises: (response.data ?? []).map(normalizeExerciseDbExercise),
        meta: response.meta,
      };
    } catch (error) {
      if (!query.bodyParts) throw error;
    }
  }

  const path = `/api/v1/exercises${buildQuery(query, false)}`;
  const response = await fetchExerciseDb<ExerciseDbListResponse<ExerciseDbRawExercise>>(path, {
    preferOss: true,
  });

  return {
    exercises: (response.data ?? []).map(normalizeExerciseDbExercise),
    meta: response.meta,
  };
}

export async function searchExerciseDbByName(
  name: string,
  keywords?: string,
  limit = 15
): Promise<NormalizedExerciseDbExercise[]> {
  const { exercises } = await listExerciseDbExercises({ name, keywords, limit });
  return exercises;
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
    { preferOss: !isRapidApiConfigured() }
  );
  return response.data ?? [];
}

export async function listExerciseDbMuscles(): Promise<ExerciseDbNamedItem[]> {
  const response = await fetchExerciseDb<ExerciseDbListResponse<ExerciseDbNamedItem>>(
    "/api/v1/muscles",
    { preferOss: !isRapidApiConfigured() }
  );
  return response.data ?? [];
}

export async function listExerciseDbEquipments(): Promise<ExerciseDbNamedItem[]> {
  const response = await fetchExerciseDb<ExerciseDbListResponse<ExerciseDbNamedItem>>(
    "/api/v1/equipments",
    { preferOss: !isRapidApiConfigured() }
  );
  return response.data ?? [];
}

export async function searchExerciseDbByMuscleGroup(
  muscleGroup: string,
  limit = 50
): Promise<NormalizedExerciseDbExercise[]> {
  const bodyPart = mapMuscleGroupToBodyPart(muscleGroup);
  if (!bodyPart) return [];

  if (isRapidApiConfigured()) {
    return searchExerciseDbByName(bodyPart, `${bodyPart},${bodyPart} workout`, limit);
  }

  const { exercises } = await listExerciseDbExercises(
    { bodyParts: bodyPart, limit },
    { preferOss: true }
  );
  return exercises;
}

export async function fetchExercisesByBodyPart(
  bodyPart: string
): Promise<NormalizedExerciseDbExercise[]> {
  if (isRapidApiConfigured()) {
    return searchExerciseDbByName(bodyPart, `${bodyPart},${bodyPart} workout`, 25);
  }

  const { exercises } = await listExerciseDbExercises(
    { bodyParts: bodyPart, limit: 100 },
    { preferOss: true }
  );
  return exercises;
}

export function pickBestExerciseMatch(
  exercises: NormalizedExerciseDbExercise[],
  searchTerms: string[],
  bodyPart?: string
): NormalizedExerciseDbExercise | null {
  const normalizedBodyPart = bodyPart?.toLowerCase();
  const pool = normalizedBodyPart
    ? exercises.filter((e) =>
        e.body_parts.some((part) => part.toLowerCase() === normalizedBodyPart)
      )
    : exercises;
  const source = pool.length > 0 ? pool : exercises;

  for (const term of searchTerms) {
    const t = term.toLowerCase();
    const exact = source.find((e) => e.name.toLowerCase() === t);
    if (exact) return exact;
  }

  for (const term of searchTerms) {
    const t = term.toLowerCase();
    const partial = source.find(
      (e) =>
        e.name.toLowerCase().includes(t) ||
        t.includes(e.name.toLowerCase()) ||
        e.keywords.some((k) => k.toLowerCase().includes(t))
    );
    if (partial) return partial;
  }

  return null;
}

export async function findExerciseDbMatch(
  searchTerms: string[],
  bodyPart?: string,
  pool?: NormalizedExerciseDbExercise[],
  keywordExtras?: string[]
): Promise<NormalizedExerciseDbExercise | null> {
  if (pool && pool.length > 0) {
    const hit = pickBestExerciseMatch(pool, searchTerms, bodyPart);
    if (hit) return hit;
  }

  if (isRapidApiConfigured()) {
    const keywordParts = [
      bodyPart,
      bodyPart ? `${bodyPart} workout` : undefined,
      ...(keywordExtras ?? []),
    ].filter(Boolean) as string[];

    for (const term of searchTerms) {
      const keywords = keywordParts.length ? keywordParts.join(",") : undefined;
      const exercises = await searchExerciseDbByName(term, keywords, 15);
      const hit = pickBestExerciseMatch(exercises, searchTerms, bodyPart);
      if (hit) return hit;
    }
    return null;
  }

  if (bodyPart) {
    const exercises = await fetchExercisesByBodyPart(bodyPart);
    return pickBestExerciseMatch(exercises, searchTerms, bodyPart);
  }

  return null;
}
