"use client";

import { cn } from "@/lib/utils";

export type SettingsTab = "general" | "profile" | "admin";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "profile", label: "Perfil" },
  { id: "admin", label: "Admin" },
];

export function SettingsTabs({
  active,
  onChange,
  showAdmin,
}: {
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
  showAdmin: boolean;
}) {
  const tabs = showAdmin ? TABS : TABS.filter((tab) => tab.id === "general");

  if (tabs.length <= 1) return null;

  return (
    <div className="mb-6 flex rounded-2xl border border-border bg-surface p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors duration-200 active:scale-[0.99]",
            active === tab.id ? "bg-accent text-background" : "text-muted hover:text-secondary"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
