"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { breathSeconds, stepLabel, stepsOf } from "@/lib/gym/flow";
import type { Flow } from "@/lib/gym/flow";
import { cn } from "@/lib/utils";

interface FlowRunnerProps {
  flow: Flow;
  onComplete: (notes?: string) => Promise<void>;
  onExit: () => void;
}

export function FlowRunner({ flow, onComplete, onExit }: FlowRunnerProps) {
  const steps = stepsOf(flow);
  const [index, setIndex] = useState(0);
  const [resting, setResting] = useState(false);
  const [restLeft, setRestLeft] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const step = steps[index];
  const progress = steps.length ? (index + 1) / steps.length : 0;
  const isLast = index >= steps.length - 1;

  const advance = useCallback(() => {
    if (isLast) {
      setFinishing(true);
      setTimeout(() => {
        void onComplete();
      }, 1400);
      return;
    }
    setIndex((i) => i + 1);
  }, [isLast, onComplete]);

  useEffect(() => {
    if (!resting || restLeft <= 0) return;
    const t = setInterval(() => {
      setRestLeft((s) => {
        if (s <= 1) {
          setResting(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [resting, restLeft]);

  function startRest() {
    if (!step) return;
    setRestLeft(breathSeconds(step));
    setResting(true);
  }

  function handleTouchEnd(clientY: number) {
    if (touchStart === null) return;
    const delta = touchStart - clientY;
    setTouchStart(null);
    if (delta > 50 && !resting) advance();
  }

  if (finishing) {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-background px-8">
        <div className="mb-6 h-16 w-16 rounded-full border-2 border-success/30 bg-success/10" />
        <p className="grok-label text-success">Completado</p>
        <h2 className="mt-2 text-center text-2xl font-semibold tracking-tight">
          {flow.name}
        </h2>
        <p className="mt-2 text-sm text-muted">{steps.length} pasos recorridos</p>
      </div>
    );
  }

  if (!step) return null;

  const sub = stepLabel(step);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-background touch-none"
      onTouchStart={(e) => setTouchStart(e.touches[0].clientY)}
      onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0].clientY)}
    >
      <div className="px-4 pt-safe">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onExit}
            className="rounded-full p-2 text-muted hover:text-foreground"
          >
            <X size={20} />
          </button>
          <span className="font-mono text-xs text-muted">
            {index + 1} / {steps.length}
          </span>
        </div>
        <div className="h-0.5 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-8">
        {resting ? (
          <div className="text-center animate-fade-up">
            <p className="grok-label mb-4">Respira</p>
            <p className="font-mono text-7xl font-light tracking-tighter text-accent">
              {restLeft}
            </p>
            <button
              type="button"
              onClick={() => setResting(false)}
              className="mt-8 text-sm text-muted underline-offset-4 hover:text-secondary hover:underline"
            >
              Saltar pausa
            </button>
          </div>
        ) : (
          <div className="w-full text-center animate-fade-up">
            <p className="grok-label mb-6">{flow.name}</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              {step.name}
            </h1>
            {sub && (
              <p className="mt-4 font-mono text-lg text-accent-soft">{sub}</p>
            )}
            {step.exercise_catalog && (
              <p className="mt-3 text-xs text-muted">
                {step.exercise_catalog.muscle_subgroup}
              </p>
            )}
            <p className="mt-12 text-xs text-muted">
              Desliza hacia arriba o toca avanzar
            </p>
          </div>
        )}
      </div>

      {!resting && (
        <div className="grid grid-cols-2 gap-3 border-t border-border p-4 pb-8 safe-bottom">
          <button
            type="button"
            onClick={startRest}
            className="rounded-2xl border border-border py-4 text-sm text-secondary transition-colors hover:border-accent-soft/40"
          >
            Pausa · {breathSeconds(step)}s
          </button>
          <button
            type="button"
            onClick={() => advance()}
            className={cn(
              "rounded-2xl py-4 text-sm font-medium transition-all active:scale-[0.98]",
              isLast
                ? "bg-success text-background"
                : "bg-accent text-background"
            )}
          >
            {isLast ? "Cerrar flujo" : "Siguiente →"}
          </button>
        </div>
      )}
    </div>
  );
}
