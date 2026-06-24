"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface WorkSetTimerProps {
  targetSeconds: number;
  onComplete: (elapsedSeconds: number) => void;
}

export function WorkSetTimer({ targetSeconds, onComplete }: WorkSetTimerProps) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (startedAt.current == null) return;
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  function start() {
    startedAt.current = Date.now();
    setElapsed(0);
    setRunning(true);
  }

  function finish() {
    const seconds = startedAt.current
      ? Math.max(1, Math.floor((Date.now() - startedAt.current) / 1000))
      : targetSeconds;
    setRunning(false);
    onComplete(seconds);
  }

  const display = running ? elapsed : targetSeconds;

  return (
    <div className="mt-3 rounded-2xl border border-border bg-surface px-4 py-3 text-center">
      <p className="grok-label mb-1">Timer de serie</p>
      <p className="font-mono text-4xl text-accent">{display}s</p>
      {!running ? (
        <Button size="sm" className="mt-3 gap-1.5" onClick={start}>
          <Play size={14} fill="currentColor" />
          Iniciar
        </Button>
      ) : (
        <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={finish}>
          <Square size={14} />
          Terminar serie
        </Button>
      )}
    </div>
  );
}
