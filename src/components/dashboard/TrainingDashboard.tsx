"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Dumbbell,
  Flame,
  Play,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { useStaleQuery } from "@/hooks/useStaleQuery";
import type { FitnessInsights } from "@/lib/fitness/profile";
import {
  activeSession,
  completedSessionDates,
  computeTrainingStreak,
  lastCompletedSession,
  sessionsThisWeek,
} from "@/lib/gym/dashboard-stats";
import { stepsOf } from "@/lib/gym/flow";
import type { Flow } from "@/lib/gym/flow";
import { buildCurrentWeekStats } from "@/lib/gym/week-chart";
import type { GymSession, Profile } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export function TrainingDashboard() {
  const router = useRouter();
  const { data: profile } = useStaleQuery<Profile>("/api/profile");
  const { data: fitnessData } = useStaleQuery<{
    insights: FitnessInsights;
    complete: boolean;
  }>("/api/profile/fitness");
  const { data: flowsData, loading: loadingFlows } = useStaleQuery<Flow[]>("/api/gym/routines");
  const { data: sessionsData, loading: loadingSessions } =
    useStaleQuery<GymSession[]>("/api/gym/sessions");
  const flows = flowsData ?? [];
  const sessions = sessionsData ?? [];
  const loading = loadingFlows || loadingSessions;

  const bootstrapping = loading && !profile && sessions.length === 0;

  const completedDates = completedSessionDates(sessions);
  const weekDays = buildCurrentWeekStats(completedDates);
  const weekCount = sessionsThisWeek(sessions);
  const streak = computeTrainingStreak(completedDates);
  const inProgress = activeSession(sessions);
  const lastDone = lastCompletedSession(sessions);
  const lastFlow = lastDone ? flows.find((f) => f.id === lastDone.routine_id) : flows[0];
  const goal = profile?.focus_areas?.[0];
  const frequency = profile?.focus_areas?.[1];

  function resumeOrStart(flow: Flow) {
    router.push(`/gym?start=${flow.id}`);
  }

  if (bootstrapping) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="stagger-children">
      <header className="mb-5 pt-4">
        <p className="grok-label">{formatDate(new Date())}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {profile?.display_name ? `Hola, ${profile.display_name}` : "Tu entrenamiento"}
        </h1>
        {profile?.identity_statement ? (
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            {profile.identity_statement}
          </p>
        ) : (
          <p className="mt-2 text-sm text-secondary">
            {goal && frequency
              ? `${goal} · ${frequency} por semana`
              : "Constancia, progreso y comunidad en un solo lugar."}
          </p>
        )}
      </header>

      <div className="mb-5 grid grid-cols-3 gap-2">
        <StatTile label="Esta semana" value={String(weekCount)} icon={Activity} />
        <StatTile label="Racha" value={`${streak}d`} icon={Flame} accent={streak > 0} />
        <StatTile label="Flujos" value={String(flows.length)} icon={TrendingUp} />
      </div>

      {fitnessData?.complete && fitnessData.insights.bmi != null ? (
        <Card className="mb-5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="grok-label">Tu condición</p>
              <p className="mt-1 text-sm font-medium">{fitnessData.insights.conditioning_label}</p>
              <p className="mt-2 text-xs text-secondary">
                IMC {fitnessData.insights.bmi}
                {fitnessData.insights.bmi_label ? ` · ${fitnessData.insights.bmi_label}` : ""}
                {fitnessData.insights.tdee_kcal
                  ? ` · ~${fitnessData.insights.tdee_kcal} kcal/día`
                  : ""}
              </p>
              {fitnessData.insights.training_hints[0] && (
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {fitnessData.insights.training_hints[0]}
                </p>
              )}
            </div>
            <Link href="/settings?tab=profile" className="shrink-0 text-xs text-accent-soft underline">
              Editar
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="mb-5 p-4">
          <p className="grok-label">Perfil físico</p>
          <p className="mt-1 text-sm text-secondary">
            Añade sexo, altura, edad y peso para personalizar tu condición y entrenamiento.
          </p>
          <Link
            href="/settings?tab=profile"
            className="mt-3 inline-flex text-xs text-accent-soft underline"
          >
            Completar perfil →
          </Link>
        </Card>
      )}

      <Card className="mb-5 p-4">
        <p className="grok-label mb-3">Semana de entrenamiento</p>
        <div className="flex justify-between gap-2">
          {weekDays.map(({ done, label, isToday, isFuture }, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "h-9 w-full max-w-[2rem] rounded-full transition-colors duration-200",
                  done ? "bg-accent" : isFuture ? "bg-surface-muted/40" : "bg-surface-muted",
                  isToday && "ring-1 ring-accent/40"
                )}
              />
              <span className={cn("text-[10px]", isToday ? "text-accent" : "text-muted")}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {inProgress && (
        <Card className="mb-5 border-accent/30 bg-accent/5 p-4">
          <p className="grok-label text-accent">Sesión en curso</p>
          <p className="mt-1 font-medium">
            {(inProgress.gym_routines as { name?: string } | undefined)?.name ?? "Rutina activa"}
          </p>
          <Button className="mt-3 w-full gap-2" onClick={() => router.push("/gym?resume=1")}>
            <Play size={16} fill="currentColor" />
            Continuar entrenamiento
          </Button>
        </Card>
      )}

      {!inProgress && lastFlow && stepsOf(lastFlow).length > 0 && (
        <Card className="mb-5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="grok-label">Retomar</p>
              <p className="mt-1 text-lg font-semibold tracking-tight">{lastFlow.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                {stepsOf(lastFlow).length} ejercicios · última sesión
              </p>
            </div>
            <Button size="sm" className="shrink-0 gap-1" onClick={() => resumeOrStart(lastFlow)}>
              <Play size={14} fill="currentColor" />
              Ir
            </Button>
          </div>
        </Card>
      )}

      <p className="grok-label mb-3">Acciones rápidas</p>
      <div className="mb-6 grid grid-cols-2 gap-2">
        <QuickLink href="/gym" icon={Dumbbell} label="Mis flujos" hint="Rutinas y catálogo" />
        <QuickLink href="/gym?tab=history" icon={TrendingUp} label="Historial" hint="Progreso y PRs" />
        <QuickLink href="/social" icon={Users} label="Social" hint="Amigos y actividad" />
        <QuickLink href="/gym?forge=1" icon={Plus} label="Nuevo flujo" hint="Armar rutina" />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="grok-label">Recientes</p>
        <Link href="/gym?tab=history" className="flex items-center gap-1 text-xs text-accent-soft">
          Ver todo <ArrowRight size={12} />
        </Link>
      </div>

      {sessions.filter((s) => s.status === "completed").length === 0 ? (
        <Card className="p-8 text-center">
          <Dumbbell size={28} className="mx-auto mb-3 text-accent-soft" />
          <p className="font-medium">Aún no hay sesiones</p>
          <p className="mt-2 text-sm text-muted">
            Crea un flujo en Flujos y registra tu primer entrenamiento.
          </p>
          <Button className="mt-5" onClick={() => router.push("/gym")}>
            Ir a Flujos
          </Button>
        </Card>
      ) : (
        <div className="space-y-2 pb-4">
          {sessions
            .filter((s) => s.status === "completed" && s.completed_at)
            .slice(0, 5)
            .map((session) => {
              const name =
                (session.gym_routines as { name?: string } | undefined)?.name ?? "Rutina";
              const when = new Date(session.completed_at!);
              const duration =
                session.completed_at && session.started_at
                  ? Math.max(
                      1,
                      Math.floor(
                        (new Date(session.completed_at).getTime() -
                          new Date(session.started_at).getTime()) /
                          60000
                      )
                    )
                  : null;
              return (
                <Card key={session.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{name}</p>
                    <p className="text-xs text-muted">
                      {when.toLocaleDateString("es-ES", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                      {duration ? ` · ${duration} min` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] text-success">
                    Hecha
                  </span>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
  accent?: boolean;
}) {
  return (
    <Card className="p-3">
      <Icon size={16} className={cn("mb-2", accent ? "text-accent" : "text-muted")} />
      <p className="font-mono text-xl font-medium tracking-tight">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </Card>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: typeof Dumbbell;
  label: string;
  hint: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full p-3 transition-all duration-200 hover:border-accent-soft/40 active:scale-[0.98]">
        <Icon size={18} className="mb-2 text-accent-soft" />
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-[10px] text-muted">{hint}</p>
      </Card>
    </Link>
  );
}
