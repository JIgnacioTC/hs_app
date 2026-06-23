"use client";

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Error de servidor");
  return data as T;
}

export const api = {
  get: <T>(path: string) => fetch(path).then((r) => handleResponse<T>(r)),
  post: <T>(path: string, body?: unknown) =>
    fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }).then((r) => handleResponse<T>(r)),
  patch: <T>(path: string, body: unknown) =>
    fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => handleResponse<T>(r)),
  put: <T>(path: string, body: unknown) =>
    fetch(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => handleResponse<T>(r)),
  delete: <T>(path: string, body?: unknown) =>
    fetch(path, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => handleResponse<T>(r)),
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

  const { publicKey } = await api.get<{ publicKey: string }>("/api/push/subscribe");
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
