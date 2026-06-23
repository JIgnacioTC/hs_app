"use client";

import { stepsOf } from "@/lib/gym/flow";
import type { Flow } from "@/lib/gym/flow";
import { cn } from "@/lib/utils";

export function FlowThread({
  flow,
  activeIndex,
  compact,
  className,
}: {
  flow: Flow;
  activeIndex?: number;
  compact?: boolean;
  className?: string;
}) {
  const steps = stepsOf(flow);
  if (!steps.length) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <span className="text-xs text-muted">Sin pasos</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", compact ? "gap-1" : "gap-1.5", className)}>
      {steps.map((step, i) => {
        const active = activeIndex === i;
        const done = activeIndex !== undefined && i < activeIndex;
        return (
          <div key={step.id} className="flex items-center gap-1.5">
            <div
              title={step.name}
              className={cn(
                "rounded-full transition-all duration-300",
                compact ? "h-1.5 w-1.5" : "h-2 w-2",
                done && "bg-success scale-100",
                active && "grok-glow h-2.5 w-2.5 bg-accent",
                !done && !active && "bg-surface-muted"
              )}
            />
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-px transition-colors",
                  compact ? "w-3" : "w-5",
                  done ? "bg-success/40" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FlowChainVertical({
  steps,
  onRemove,
}: {
  steps: { id: string; name: string; prescription?: string; muscleGroup?: string }[];
  onRemove?: (id: string) => void;
}) {
  if (!steps.length) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        Toca «Elegir del catálogo» para armar tu cadena
      </p>
    );
  }

  return (
    <div className="relative pl-4">
      <div className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-accent/40 via-border to-transparent" />
      <ul className="space-y-4">
        {steps.map((step, i) => (
          <li key={step.id} className="relative flex items-start gap-3">
            <div className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-accent-soft bg-surface" />
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="font-medium tracking-tight">{step.name}</p>
              <p className="text-xs text-muted">
                {[step.muscleGroup, step.prescription].filter(Boolean).join(" · ")}
              </p>
            </div>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(step.id)}
                className="text-xs text-muted hover:text-danger"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
