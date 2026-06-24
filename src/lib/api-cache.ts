const DEFAULT_TTL_MS = 60_000;

interface CacheEntry {
  data: unknown;
  expires: number;
}

const store = new Map<string, CacheEntry>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached(key: string, data: unknown, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function peekCached<T>(key: string): T | null {
  return getCached<T>(key);
}

export const API_CACHE_TTL = {
  profile: 120_000,
  routines: 45_000,
  sessions: 30_000,
  catalog: 300_000,
  social: 30_000,
  default: DEFAULT_TTL_MS,
} as const;

export function ttlForPath(path: string): number {
  if (path.startsWith("/api/profile")) return API_CACHE_TTL.profile;
  if (path.startsWith("/api/gym/routines")) return API_CACHE_TTL.routines;
  if (path.startsWith("/api/gym/sessions")) return API_CACHE_TTL.sessions;
  if (path.startsWith("/api/gym/catalog")) return API_CACHE_TTL.catalog;
  if (path.startsWith("/api/gym/catalog/muscle-groups")) return API_CACHE_TTL.catalog;
  if (path.startsWith("/api/social")) return API_CACHE_TTL.social;
  return API_CACHE_TTL.default;
}
