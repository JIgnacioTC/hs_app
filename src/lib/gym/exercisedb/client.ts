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

const DEFAULT_BASE_URL =
  process.env.EXERCISEDB_API_URL?.replace(/\/$/, "") ?? "https://v2.exercisedb.dev";
const FALLBACK_BASE_URL =
  process.env.EXERCISEDB_FALLBACK_URL?.replace(/\/$/, "") ?? "https://oss.exercisedb.dev";

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "HS-Gym/1.0",
  };

  const apiKey = process.env.EXERCISEDB_API_KEY;
  if (apiKey) {
    headers["X-RapidAPI-Key"] = apiKey;
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
  options?: { baseUrl?: string; allowFallback?: boolean }
): Promise<T> {
  const bases = options?.allowFallback === false
    ? [options.baseUrl ?? DEFAULT_BASE_URL]
    : [options?.baseUrl ?? DEFAULT_BASE_URL, FALLBACK_BASE_URL];

  let lastError: Error | null = null;

  for (const base of bases) {
    const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
    try {
      const res = await fetch(url, {
        headers: buildHeaders(),
        next: { revalidate: 3600 },
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok || !isJsonResponse(contentType)) {
        lastError = new Error(`ExerciseDB ${res.status} at ${base}`);
        continue;
      }

      return (await res.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
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
  query: ExerciseDbQuery = {}
): Promise<{ exercises: NormalizedExerciseDbExercise[]; meta?: ExerciseDbListResponse<ExerciseDbRawExercise>["meta"] }> {
  const response = await fetchExerciseDb<ExerciseDbListResponse<ExerciseDbRawExercise>>(
    `/api/v1/exercises${buildQuery(query)}`
  );

  return {
    exercises: (response.data ?? []).map(normalizeExerciseDbExercise),
    meta: response.meta,
  };
}

export async function getExerciseDbExercise(
  exerciseId: string
): Promise<NormalizedExerciseDbExercise | null> {
  try {
    const response = await fetchExerciseDb<ExerciseDbItemResponse<ExerciseDbRawExercise>>(
      `/api/v1/exercises/${encodeURIComponent(exerciseId)}`
    );
    if (!response.data) return null;
    return normalizeExerciseDbExercise(response.data);
  } catch {
    return null;
  }
}

export async function listExerciseDbBodyParts(): Promise<ExerciseDbNamedItem[]> {
  const response = await fetchExerciseDb<ExerciseDbListResponse<ExerciseDbNamedItem>>(
    "/api/v1/bodyparts"
  );
  return response.data ?? [];
}

export async function listExerciseDbMuscles(): Promise<ExerciseDbNamedItem[]> {
  const response = await fetchExerciseDb<ExerciseDbListResponse<ExerciseDbNamedItem>>(
    "/api/v1/muscles"
  );
  return response.data ?? [];
}

export async function listExerciseDbEquipments(): Promise<ExerciseDbNamedItem[]> {
  const response = await fetchExerciseDb<ExerciseDbListResponse<ExerciseDbNamedItem>>(
    "/api/v1/equipments"
  );
  return response.data ?? [];
}

export async function searchExerciseDbByMuscleGroup(
  muscleGroup: string,
  limit = 50
): Promise<NormalizedExerciseDbExercise[]> {
  const bodyPart = mapMuscleGroupToBodyPart(muscleGroup);
  if (!bodyPart) return [];
  const { exercises } = await listExerciseDbExercises({ bodyParts: bodyPart, limit });
  return exercises;
}

export async function findExerciseDbMatch(
  searchTerms: string[],
  bodyPart?: string
): Promise<NormalizedExerciseDbExercise | null> {
  for (const term of searchTerms) {
    const { exercises } = await listExerciseDbExercises({
      search: term,
      bodyParts: bodyPart,
      limit: 25,
    });

    const exact = exercises.find((e) =>
      searchTerms.some((t) => e.name.toLowerCase() === t.toLowerCase())
    );
    if (exact) return exact;

    const partial = exercises.find((e) =>
      searchTerms.some((t) => e.name.toLowerCase().includes(t.toLowerCase()))
    );
    if (partial) return partial;
  }

  if (bodyPart) {
    const { exercises } = await listExerciseDbExercises({ bodyParts: bodyPart, limit: 100 });
    for (const term of searchTerms) {
      const hit = exercises.find((e) => e.name.toLowerCase().includes(term.toLowerCase()));
      if (hit) return hit;
    }
  }

  return null;
}
