"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HabitManageCard } from "@/components/habits/HabitManageCard";
import { HabitCreateWizard } from "@/components/habits/HabitCreateWizard";
import { api } from "@/lib/api-client";
import type { CreateHabitPayload, Habit } from "@/lib/types";

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await api.get<Habit[]>("/api/habits");
    setHabits(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const params = new URLSearchParams(globalThis.location?.search ?? "");
    const focus = params.get("focus");
    if (focus) setExpandedId(focus);
  }, [load]);

  async function createHabit(payload: CreateHabitPayload) {
    await api.post("/api/habits", payload);
    setShowWizard(false);
    await load();
  }

  async function deleteHabit(id: string) {
    await api.delete("/api/habits", { id });
    await load();
  }

  const buildCount = habits.filter((h) => (h.habit_kind ?? "build") === "build").length;
  const breakCount = habits.filter((h) => h.habit_kind === "break").length;

  return (
    <AppShell>
      <header className="mb-6 flex items-start justify-between pt-4">
        <div>
          <p className="grok-label">Sistema</p>
          <h1 className="text-2xl font-semibold tracking-tight">Hábitos atómicos</h1>
          <p className="mt-1 text-sm text-secondary">
            Identidad · Señal · 2 min · Recompensa
          </p>
        </div>
        {!showWizard && (
          <Button size="sm" onClick={() => setShowWizard(true)} className="gap-1">
            <Plus size={16} />
            Nuevo
          </Button>
        )}
      </header>

      {!showWizard && habits.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="grok-label">Construir</p>
            <p className="font-mono text-2xl font-medium text-success">{buildCount}</p>
          </Card>
          <Card className="p-4">
            <p className="grok-label">Eliminar</p>
            <p className="font-mono text-2xl font-medium text-warning">{breakCount}</p>
          </Card>
        </div>
      )}

      {showWizard && (
        <HabitCreateWizard
          existingHabits={habits}
          onSubmit={createHabit}
          onCancel={() => setShowWizard(false)}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-[20px] bg-surface-muted" />
          ))}
        </div>
      ) : habits.length === 0 && !showWizard ? (
        <Card className="p-8 text-center">
          <Sparkles size={28} className="mx-auto mb-3 text-accent-soft" />
          <p className="font-medium">Empieza con 1% mejor cada día</p>
          <p className="mt-2 text-sm text-muted">
            Crea un hábito con el método de James Clear
          </p>
          <Button className="mt-6" onClick={() => setShowWizard(true)}>
            Crear primer hábito
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <HabitManageCard
              key={habit.id}
              habit={habit}
              expanded={expandedId === habit.id}
              onToggle={() => setExpandedId(expandedId === habit.id ? null : habit.id)}
              onDelete={() => deleteHabit(habit.id)}
              onUpdate={load}
            />
          ))}
        </div>
      )}

      <Card className="mt-8 p-4">
        <p className="grok-label mb-2">Principio clave</p>
        <p className="text-sm leading-relaxed text-secondary">
          No te elevas al nivel de tus metas. Caes al nivel de tus sistemas.
        </p>
        <Link href="/" className="mt-3 inline-block text-sm text-accent hover:underline">
          Ir al panel de hoy →
        </Link>
      </Card>
    </AppShell>
  );
}
