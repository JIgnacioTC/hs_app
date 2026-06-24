"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSplash } from "@/components/AppSplash";
import {
  hasWarmAppCache,
  TAB_ROUTES,
  warmAppCache,
  warmAppCacheInBackground,
} from "@/lib/app-prefetch";

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [splashExiting, setSplashExiting] = useState(false);
  const [showSplash, setShowSplash] = useState(() => !hasWarmAppCache());

  useEffect(() => {
    for (const route of TAB_ROUTES) {
      router.prefetch(route);
    }

    const cached = hasWarmAppCache();

    if (cached) {
      warmAppCacheInBackground();
      return;
    }

    let cancelled = false;
    const minSplashMs = 420;
    const started = performance.now();

    void warmAppCache().finally(() => {
      if (cancelled) return;

      const elapsed = performance.now() - started;
      const remaining = Math.max(0, minSplashMs - elapsed);

      globalThis.setTimeout(() => {
        if (cancelled) return;
        setSplashExiting(true);
        globalThis.setTimeout(() => {
          if (!cancelled) setShowSplash(false);
        }, 480);
      }, remaining);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <>
      {showSplash && <AppSplash exiting={splashExiting} />}
      <div
        className={
          showSplash && !splashExiting
            ? "opacity-0"
            : "animate-page-enter opacity-100"
        }
      >
        {children}
      </div>
    </>
  );
}
