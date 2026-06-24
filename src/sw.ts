/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const gymApiCache = new StaleWhileRevalidate({
  cacheName: "hs-gym-api",
  plugins: [
    new ExpirationPlugin({
      maxEntries: 32,
      maxAgeSeconds: 60 * 10,
    }),
  ],
});

const profileApiCache = new StaleWhileRevalidate({
  cacheName: "hs-profile-api",
  plugins: [
    new ExpirationPlugin({
      maxEntries: 8,
      maxAgeSeconds: 60 * 5,
    }),
  ],
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ request, url }) =>
        request.method === "GET" &&
        (url.pathname.startsWith("/api/gym/routines") ||
          url.pathname.startsWith("/api/gym/sessions") ||
          url.pathname.startsWith("/api/gym/catalog")),
      handler: gymApiCache,
    },
    {
      matcher: ({ request, url }) =>
        request.method === "GET" && url.pathname.startsWith("/api/profile"),
      handler: profileApiCache,
    },
    ...defaultCache,
  ],
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data: { title?: string; body?: string; url?: string } = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "HS", body: event.data.text() };
  }

  const title = data.title ?? "HS";
  const options: NotificationOptions & { vibrate?: number[] } = {
    body: data.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url ?? "/" },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) return (client as WindowClient).navigate(url);
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

serwist.addEventListeners();
