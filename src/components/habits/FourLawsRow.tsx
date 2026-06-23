import { FOUR_LAWS, habitLawColors } from "@/styles/branding";
import { cn } from "@/lib/utils";
import type { Habit } from "@/lib/types";

const lawMeta = FOUR_LAWS.map((law) => ({
  ...law,
  color: habitLawColors[law.key as keyof typeof habitLawColors],
}));

export function FourLawsRow({ habit, compact }: { habit: Habit; compact?: boolean }) {
  const filled = lawMeta.filter((l) => {
    const val = habit[l.field];
    return typeof val === "string" && val.trim().length > 0;
  });

  if (!filled.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", compact && "gap-1")}>
      {filled.map((law) => (
        <span
          key={law.key}
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide",
            compact ? "px-1.5" : "px-2"
          )}
          style={{
            borderColor: `${law.color}40`,
            color: law.color,
            backgroundColor: `${law.color}10`,
          }}
        >
          {law.label}
        </span>
      ))}
    </div>
  );
}

export function IdentityChip({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <p className="text-sm leading-relaxed text-secondary">
      <span className="grok-label mr-2 inline-block">Identidad</span>
      {text}
    </p>
  );
}
