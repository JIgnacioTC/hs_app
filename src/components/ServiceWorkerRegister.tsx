"use client";

import { useEffect } from "react";
import { warmAppCacheInBackground } from "@/lib/app-prefetch";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => warmAppCacheInBackground())
      .catch(console.error);
  }, []);

  return null;
}
