"use client";

import { cn } from "@/lib/utils";

export function AppSplash({ exiting = false }: { exiting?: boolean }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ease-out",
        exiting ? "pointer-events-none opacity-0" : "opacity-100"
      )}
      aria-live="polite"
      aria-busy={!exiting}
    >
      <div className="grok-bg absolute inset-0" />
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] border border-border bg-surface",
            !exiting && "animate-splash-logo"
          )}
        >
          <span className="font-mono text-2xl font-medium text-accent">HS</span>
        </div>
        <div className="h-1 w-28 overflow-hidden rounded-full bg-surface-muted">
          <div className="splash-bar h-full w-1/2 rounded-full bg-accent/80" />
        </div>
        <p className="mt-4 text-xs tracking-wide text-muted">Preparando tu espacio…</p>
      </div>
    </div>
  );
}
