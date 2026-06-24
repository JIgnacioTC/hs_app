"use client";

import { useCallback, useEffect, useState } from "react";
import { peekCached } from "@/lib/api-cache";
import { api } from "@/lib/api-client";

export function useStaleQuery<T>(path: string, enabled = true) {
  const [data, setData] = useState<T | null>(() => (enabled ? peekCached<T>(path) : null));
  const [loading, setLoading] = useState(() => enabled && peekCached<T>(path) === null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    const fresh = await api.get<T>(path);
    setData(fresh);
    return fresh;
  }, [path]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const cached = peekCached<T>(path);

    if (cached !== null) {
      setData(cached);
      setLoading(false);
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    api
      .get<T>(path)
      .then((fresh) => {
        if (!cancelled) {
          setData(fresh);
          setLoading(false);
          setRefreshing(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path, enabled]);

  return { data, loading, refreshing, refresh, setData };
}

export function useStaleQueries<T extends readonly string[]>(paths: T) {
  const [loading, setLoading] = useState(() =>
    paths.some((path) => peekCached(path) === null)
  );
  const [refreshing, setRefreshing] = useState(false);
  const [results, setResults] = useState<{
    [K in T[number]]: unknown;
  }>(() => {
    const initial = {} as { [K in T[number]]: unknown };
    for (const path of paths) {
      initial[path as T[number]] = peekCached(path);
    }
    return initial;
  });

  useEffect(() => {
    let cancelled = false;
    const hasCache = paths.every((path) => peekCached(path) !== null);

    if (hasCache) {
      setLoading(false);
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    Promise.all(paths.map((path) => api.get(path)))
      .then((values) => {
        if (cancelled) return;
        const next = {} as { [K in T[number]]: unknown };
        paths.forEach((path, index) => {
          next[path as T[number]] = values[index];
        });
        setResults(next);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [paths]);

  return { results, loading, refreshing };
}
