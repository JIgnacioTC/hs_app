"use client";

import { useState } from "react";
import { Play, Send } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { FlowThread } from "@/components/gym/FlowThread";
import { ShareRoutineSheet } from "@/components/social/ShareRoutineSheet";
import { moodFromDescription, stepsOf } from "@/lib/gym/flow";
import type { Flow } from "@/lib/gym/flow";
import { cn } from "@/lib/utils";

export function FlowCard({
  flow,
  onStart,
  onEdit,
  className,
}: {
  flow: Flow;
  onStart: () => void;
  onEdit: () => void;
  className?: string;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const steps = stepsOf(flow);
  const mood = moodFromDescription(flow.description);
  const canStart = steps.length > 0;

  return (
    <>
      <Card
        className={cn(
          "group relative overflow-hidden p-0 transition-colors hover:border-accent-soft/30",
          className
        )}
      >
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/[0.03] blur-2xl" />
        <button type="button" onClick={onEdit} className="w-full p-5 text-left">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              {mood && (
                <span className="grok-label text-accent-soft">{mood.label}</span>
              )}
              <h3 className="mt-1 text-lg font-semibold tracking-tight">{flow.name}</h3>
              {mood && (
                <p className="mt-0.5 text-xs text-muted">{mood.hint}</p>
              )}
            </div>
            <span className="font-mono text-xs text-muted">{steps.length} pasos</span>
          </div>
          <FlowThread flow={flow} />
        </button>

        <div className="grid grid-cols-[auto_1fr] gap-2 border-t border-border px-3 py-2">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            disabled={!canStart}
            className={cn(
              "flex items-center justify-center rounded-2xl border border-border px-4 py-3 text-muted transition-colors",
              canStart ? "hover:text-accent active:scale-[0.98]" : "cursor-not-allowed opacity-40"
            )}
            title="Enviar a un amigo"
          >
            <Send size={18} />
          </button>
          <button
            type="button"
            disabled={!canStart}
            onClick={onStart}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium transition-all",
              canStart
                ? "bg-accent text-background active:scale-[0.98]"
                : "cursor-not-allowed text-muted"
            )}
          >
            <Play size={16} fill="currentColor" />
            Entrar al flujo
          </button>
        </div>
      </Card>

      <ShareRoutineSheet
        open={shareOpen}
        routineId={flow.id}
        routineName={flow.name}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
