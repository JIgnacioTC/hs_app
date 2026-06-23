"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { showLocalNotification } from "@/lib/notifications";

interface RestTimerProps {
  initialSeconds: number;
  onFinish: () => void;
  exerciseName: string;
  nextLabel: string;
  flowName?: string;
}

export function RestTimer({
  initialSeconds,
  onFinish,
  exerciseName,
  nextLabel,
  flowName,
}: RestTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const finished = useRef(false);
  const warned10 = useRef(false);

  useEffect(() => {
    finished.current = false;
    warned10.current = false;
    setSeconds(initialSeconds);

    void showLocalNotification("Descanso iniciado", {
      body: `${exerciseName} · ${initialSeconds}s`,
      tag: "gym-rest-start",
      url: "/gym",
      silent: true,
    });

    const id = setInterval(() => {
      setSeconds((s) => {
        if (s === 10 && !warned10.current) {
          warned10.current = true;
          void showLocalNotification("10 segundos", {
            body: `Siguiente: ${nextLabel}`,
            tag: "gym-rest-10s",
            url: "/gym",
          });
        }

        if (s <= 1) {
          clearInterval(id);
          if (!finished.current) {
            finished.current = true;
            void showLocalNotification("Descanso terminado", {
              body: nextLabel,
              tag: "gym-rest-end",
              url: "/gym",
            }).then(onFinish);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [initialSeconds, onFinish, exerciseName, nextLabel, flowName]);

  function skip() {
    if (!finished.current) {
      finished.current = true;
      onFinish();
    }
  }

  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  const display = mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}`;

  return (
    <div className="fixed inset-0 z-[85] flex flex-col items-center justify-center bg-background px-6 animate-fade-up">
      <p className="grok-label mb-2">Descanso</p>
      {flowName && <p className="mb-1 text-[10px] text-muted">{flowName}</p>}
      <p className="mb-1 text-sm text-secondary">{exerciseName}</p>
      <p className="font-mono text-8xl font-light tracking-tighter text-accent">{display}</p>
      <p className="mt-4 text-xs text-muted">Siguiente: {nextLabel}</p>

      <div className="mt-10 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSeconds((s) => Math.max(0, s - 15))}
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface text-secondary active:scale-95"
        >
          <Minus size={20} />
        </button>
        <span className="font-mono text-xs text-muted">±15s</span>
        <button
          type="button"
          onClick={() => setSeconds((s) => s + 15)}
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface text-secondary active:scale-95"
        >
          <Plus size={20} />
        </button>
      </div>

      <Button variant="ghost" className="mt-10 gap-2" onClick={skip}>
        <SkipForward size={16} />
        Saltar descanso
      </Button>
    </div>
  );
}
