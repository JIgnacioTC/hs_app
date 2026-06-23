"use client";

import { cn } from "@/lib/utils";

export type GymTab = "flows" | "history" | "exercises";

const TABS: { id: GymTab; label: string }[] = [
  { id: "flows", label: "Flujos" },
  { id: "history", label: "Historial" },
  { id: "exercises", label: "Ejercicios" },
];

export function GymTabs({
  active,
  onChange,
}: {
  active: GymTab;
  onChange: (tab: GymTab) => void;
}) {
  return (
    <div className="mb-6 flex rounded-2xl border border-border bg-surface p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors",
            active === tab.id
              ? "bg-accent text-background"
              : "text-muted hover:text-secondary"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
