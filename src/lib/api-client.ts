"use client";

import {
  getCached,
  invalidateCache,
  peekCached,
  setCached,
  ttlForPath,
} from "@/lib/api-cache";

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const raw = await res.text();

  if (!contentType.includes("application/json")) {
    const snippet = raw.trim().slice(0, 120);
    throw new Error(
      res.ok
        ? "Respuesta inválida del servidor"
        : `Error ${res.status}${snippet ? `: ${snippet}` : ""}`
    );
  }

  let data: { error?: string };
  try {
    data = JSON.parse(raw) as { error?: string };
  } catch {
    throw new Error("Respuesta inválida del servidor (JSON corrupto)");
  }

  if (!res.ok) throw new Error(data.error ?? "Error de servidor");
  return data as T;
}

type GetOptions = {
  cache?: boolean;
  ttl?: number;
  revalidate?: boolean;
};

function fetchGet<T>(path: string, options?: GetOptions): Promise<T> {
  const useCache = options?.cache !== false;
  const ttl = options?.ttl ?? ttlForPath(path);

  if (useCache) {
    const cached = getCached<T>(path);
    if (cached !== null) return Promise.resolve(cached);
  }

  return fetch(path).then(async (res) => {
    const data = await handleResponse<T>(res);
    if (useCache) setCached(path, data, ttl);
    return data;
  });
}

function mutateInvalidate(path: string) {
  if (path.startsWith("/api/gym")) {
    invalidateCache("/api/gym");
    invalidateCache("/api/profile");
    return;
  }
  if (path.startsWith("/api/profile")) {
    invalidateCache("/api/profile");
    return;
  }
  if (path.startsWith("/api/social")) {
    invalidateCache("/api/social");
    return;
  }
  invalidateCache(path.split("?")[0]);
}

export const api = {
  get: <T>(path: string, options?: GetOptions) => fetchGet<T>(path, options),

  /** Returns cached data immediately and refreshes in the background. */
  getStale: <T>(path: string, options?: Omit<GetOptions, "revalidate">) => {
    const cached = peekCached<T>(path);
    const fresh = fetchGet<T>(path, options);
    return cached !== null ? Promise.resolve(cached) : fresh;
  },

  post: <T>(path: string, body?: unknown) =>
    fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }).then(async (r) => {
      const data = await handleResponse<T>(r);
      mutateInvalidate(path);
      return data;
    }),

  patch: <T>(path: string, body: unknown) =>
    fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => {
      const data = await handleResponse<T>(r);
      mutateInvalidate(path);
      return data;
    }),

  put: <T>(path: string, body: unknown) =>
    fetch(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => {
      const data = await handleResponse<T>(r);
      mutateInvalidate(path);
      return data;
    }),

  delete: <T>(path: string, body?: unknown) =>
    fetch(path, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }).then(async (r) => {
      const data = await handleResponse<T>(r);
      mutateInvalidate(path);
      return data;
    }),

  invalidate: invalidateCache,
};

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = globalThis.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(): Promise<boolean> {
  if (!("serviceWorker" in globalThis.navigator) || !("PushManager" in globalThis)) {
    return false;
  }

  type NotificationWithPermission = typeof Notification & {
    requestPermission(): Promise<NotificationPermission>;
  };
  const permission = await (Notification as NotificationWithPermission).requestPermission();
  if (permission !== "granted") return false;

  const { publicKey } = await api.get<{ publicKey: string }>("/api/push/subscribe", {
    cache: false,
  });
  if (!publicKey) return false;

  const registration = await globalThis.navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const json = subscription.toJSON();
  await api.post("/api/push/subscribe", {
    endpoint: json.endpoint,
    keys: json.keys,
  });

  return true;
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await globalThis.navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) await subscription.unsubscribe();
  await api.delete("/api/push/subscribe");
}
