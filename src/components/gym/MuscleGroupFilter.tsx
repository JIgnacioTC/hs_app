"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface MuscleGroupFilterProps {
  groups: readonly string[];
  active: string | null;
  onSelect: (group: string | null) => void;
}

export function MuscleGroupFilter({ groups, active, onSelect }: MuscleGroupFilterProps) {
  const [mediaMap, setMediaMap] = useState<Record<string, string>>({});

  useEffect(() => {
    api
      .get<Record<string, string>>("/api/gym/catalog/muscle-groups/media")
      .then(setMediaMap)
      .catch(() => setMediaMap({}));
  }, []);

  return (
    <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <FilterChip active={!active} onClick={() => onSelect(null)} label="Todos" />
      {groups.map((group) => (
        <FilterChip
          key={group}
          active={active === group}
          onClick={() => onSelect(group)}
          label={group}
          imageUrl={mediaMap[group]}
        />
      ))}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  imageUrl,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  imageUrl?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
        active ? "border-accent-soft bg-accent/10 text-accent" : "border-border text-muted"
      )}
    >
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-5 w-5 rounded-full object-cover" loading="lazy" />
      )}
      {label}
    </button>
  );
}
