"use client";

export interface LocalNotificationOptions {
  body?: string;
  url?: string;
  tag?: string;
  silent?: boolean;
}

export function canUseNotifications() {
  return typeof globalThis !== "undefined" && "Notification" in globalThis;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!canUseNotifications()) return "unsupported";
  return Notification.permission;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!canUseNotifications()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  type NotificationWithPermission = typeof Notification & {
    requestPermission(): Promise<NotificationPermission>;
  };
  const permission = await (Notification as NotificationWithPermission).requestPermission();
  return permission === "granted";
}

export async function showLocalNotification(
  title: string,
  options: LocalNotificationOptions = {}
): Promise<void> {
  if (!canUseNotifications() || Notification.permission !== "granted") return;

  const payload: NotificationOptions & { vibrate?: number[] } = {
    body: options.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: options.tag ?? "hs-local",
    data: { url: options.url ?? "/" },
    vibrate: options.silent ? undefined : [100, 50, 100],
    silent: options.silent ?? false,
  };

  if ("serviceWorker" in globalThis.navigator) {
    try {
      const reg = await globalThis.navigator.serviceWorker.ready;
      await reg.showNotification(title, payload);
      return;
    } catch {
      // fallback below
    }
  }

  new Notification(title, payload);
}
