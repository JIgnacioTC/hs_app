"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { HabitAtomicCard } from "@/components/habits/HabitAtomicCard";
import { api } from "@/lib/api-client";
import type { CompletionType, Habit, Profile } from "@/lib/types";
import { cn, formatDate, todayISO } from "@/lib/utils";
import { IDENTITY_PREFIX } from "@/styles/branding";

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const today = todayISO();

  const load = useCallback(async () => {
    try {
      const [p, h] = await Promise.all([
        api.get<Profile>("/api/profile"),
        api.get<Habit[]>("/api/habits"),
      ]);
      setProfile(p);
      setHabits(h);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dayOfWeek = new Date().getDay();
  const todayHabits = habits.filter((h) => h.target_days.includes(dayOfWeek));
  const done = todayHabits.filter((h) => h.stats?.completedToday).length;
  const total = todayHabits.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const missedAny = todayHabits.some((h) => h.stats?.missedYesterday && !h.stats?.completedToday);

  async function completeHabit(habitId: string, type: CompletionType) {
    await api.post("/api/habits/log", {
      habit_id: habitId,
      log_date: today,
      completed: true,
      completion_type: type,
    });
    await load();
  }

  async function undoHabit(habitId: string) {
    await api.delete("/api/habits/log", { habit_id: habitId, log_date: today });
    await load();
  }

  const identity =
    profile?.identity_statement ||
    (profile?.display_name ? `${IDENTITY_PREFIX} me cuido cada día` : "");

  return (
    <AppShell>
      <header className="mb-6 animate-fade-up pt-4">
        <p className="grok-label">{formatDate(new Date())}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {profile?.display_name ? profile.display_name : "Hoy"}
        </h1>
        {identity && (
          <p className="mt-2 text-sm leading-relaxed text-secondary">{identity}</p>
        )}
      </header>

      <Card className="mb-6 p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="grok-label">Compuesto diario</p>
            <p className="mt-1 font-mono text-4xl font-medium tracking-tight text-accent">
              {pct}
              <span className="text-lg text-muted">%</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm text-secondary">
              {done}/{total}
            </p>
            <p className="text-xs text-muted">sistemas activos</p>
          </div>
        </div>
        <div className="mt-5 h-1 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>

      {missedAny && (
        <Card className="mb-6 flex gap-3 border-warning/20 bg-warning/5 p-4">
          <AlertTriangle size={18} className="shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-warning">No faltes dos veces</p>
            <p className="mt-0.5 text-xs text-secondary">
              Ayer hubo un fallo. Hoy es tu segunda oportunidad — la regla de recuperación.
            </p>
          </div>
        </Card>
      )}

      <div className="mb-3 flex items-center justify-between">
        <p className="grok-label">Rituales de hoy</p>
        <Link href="/habits" className="flex items-center gap-1 text-xs text-accent-soft hover:text-accent">
          Gestionar <ArrowRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-[20px] bg-surface-muted" />
          ))}
        </div>
      ) : todayHabits.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted">Sin rituales programados para hoy.</p>
          <Link href="/habits" className="mt-3 inline-block text-sm text-accent">
            Diseñar un hábito atómico →
          </Link>
        </Card>
      ) : (
        <div className={cn("space-y-3", missedAny && "animate-fade-up")}>
          {todayHabits.map((habit) => (
            <HabitAtomicCard
              key={habit.id}
              habit={habit}
              expanded
              onComplete={(type) => completeHabit(habit.id, type)}
              onUndo={() => undoHabit(habit.id)}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
