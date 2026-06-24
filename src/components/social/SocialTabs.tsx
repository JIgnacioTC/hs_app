"use client";

import { cn } from "@/lib/utils";

export type SocialTab = "feed" | "routines" | "friends";

export function SocialTabs({
  active,
  onChange,
}: {
  active: SocialTab;
  onChange: (tab: SocialTab) => void;
}) {
  const tabs: { id: SocialTab; label: string }[] = [
    { id: "feed", label: "Actividad" },
    { id: "routines", label: "Rutinas" },
    { id: "friends", label: "Amigos" },
  ];

  return (
    <div className="mb-6 flex gap-1 rounded-2xl border border-border bg-surface-muted p-1">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "flex-1 rounded-xl py-2 text-sm font-medium transition-colors",
            active === id ? "bg-surface text-foreground shadow-sm" : "text-muted"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
