"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  Dumbbell,
  HeartPulse,
  Sparkles,
  Target,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import {
  BodyProfileForm,
  bodyProfileToPayload,
  EMPTY_BODY_PROFILE,
  isBodyProfileFormValid,
  type BodyProfileFormValues,
} from "@/components/settings/BodyProfileForm";
import { api, subscribeToPush } from "@/lib/api-client";
import {
  STARTER_PLANS,
  TRAINING_FREQUENCY,
  TRAINING_GOALS,
  type TrainingFrequencyId,
  type TrainingGoalId,
} from "@/lib/gym/onboarding";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: User, title: "¿Cómo te llamamos?", subtitle: "Tu espacio de entrenamiento empieza aquí" },
  {
    icon: HeartPulse,
    title: "Tu perfil físico",
    subtitle: "Para calcular tu condición y recomendarte mejor",
  },
  { icon: Target, title: "Tu objetivo", subtitle: "Personalizamos tu primer flujo" },
  { icon: Zap, title: "Tu ritmo", subtitle: "¿Cuántos días entrenas por semana?" },
  { icon: Dumbbell, title: "Primer flujo", subtitle: "Te armamos una rutina de inicio" },
  { icon: Bell, title: "Mantente al día", subtitle: "Likes, comentarios y rutinas de amigos" },
];

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [motivation, setMotivation] = useState("");
  const [bodyProfile, setBodyProfile] = useState<BodyProfileFormValues>(EMPTY_BODY_PROFILE);
  const [goal, setGoal] = useState<TrainingGoalId>("general");
  const [frequency, setFrequency] = useState<TrainingFrequencyId>("4");
  const [createStarter, setCreateStarter] = useState(true);
  const [loading, setLoading] = useState(false);

  const plan = STARTER_PLANS[goal];
  const isLast = step === STEPS.length - 1;

  async function finish(enablePush: boolean) {
    setLoading(true);
    try {
      await api.patch("/api/profile/fitness", bodyProfileToPayload(bodyProfile));

      const onboarding = await api.post<{
        starter_routine: { id: string; name: string } | null;
        profile: { focus_areas: string[] };
      }>("/api/gym/onboarding", {
        goal,
        frequency,
        create_starter: createStarter,
      });

      await api.patch("/api/profile", {
        display_name: displayName.trim(),
        identity_statement: motivation.trim()
          ? motivation.trim()
          : `Entreno con foco en ${TRAINING_GOALS.find((g) => g.id === goal)?.label.toLowerCase()}`,
        focus_areas: onboarding.profile.focus_areas,
        wizard_completed: true,
      });

      if (enablePush) {
        await subscribeToPush();
      }

      router.push(onboarding.starter_routine ? "/gym" : "/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  const StepIcon = STEPS[step].icon;
  const canContinue =
    step === 0
      ? Boolean(displayName.trim())
      : step === 1
        ? isBodyProfileFormValid(bodyProfile)
        : true;

  return (
    <div className="grok-bg flex min-h-dvh flex-col px-6 py-8 pt-safe">
      <div className="relative mx-auto w-full max-w-sm flex-1">
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-0.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-accent" : "bg-surface-muted"
              )}
            />
          ))}
        </div>

        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface">
            <StepIcon size={22} className="text-accent-soft" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{STEPS[step].title}</h1>
            <p className="text-sm text-secondary">{STEPS[step].subtitle}</p>
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Tu nombre"
                value={displayName}
                onChange={(e) => setDisplayName(e.currentTarget.value)}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="motivation">Mantra (opcional)</Label>
              <Textarea
                id="motivation"
                placeholder="Ej: Entreno para sentirme fuerte y constante"
                value={motivation}
                onChange={(e) => setMotivation(e.currentTarget.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 1 && <BodyProfileForm values={bodyProfile} onChange={setBodyProfile} />}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-2">
            {TRAINING_GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoal(g.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all",
                  goal === g.id
                    ? "border-accent-soft bg-accent/10"
                    : "border-border hover:border-accent-soft/40"
                )}
              >
                <span className="text-xl">{g.emoji}</span>
                <p className="mt-2 text-sm font-medium">{g.label}</p>
                <p className="mt-1 text-[10px] leading-snug text-muted">{g.hint}</p>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2">
            {TRAINING_FREQUENCY.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFrequency(f.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all",
                  frequency === f.id
                    ? "border-accent-soft bg-accent/10"
                    : "border-border hover:border-accent-soft/40"
                )}
              >
                <div>
                  <p className="font-medium">{f.label}</p>
                  <p className="text-xs text-muted">{f.hint}</p>
                </div>
                {frequency === f.id && <Sparkles size={16} className="text-accent" />}
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Card className="border-accent/20 bg-accent/5 p-4">
              <p className="grok-label text-accent">Vista previa</p>
              <p className="mt-1 text-lg font-semibold">{plan.name}</p>
              <p className="mt-2 text-sm text-secondary">
                {plan.muscles.length} ejercicios compuestos ·{" "}
                {TRAINING_GOALS.find((g) => g.id === goal)?.label}
              </p>
              <ul className="mt-3 space-y-1 text-xs text-muted">
                {plan.muscles.map((m) => (
                  <li key={m}>· {m}</li>
                ))}
              </ul>
            </Card>
            <button
              type="button"
              onClick={() => setCreateStarter((v) => !v)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left",
                createStarter ? "border-accent-soft bg-surface" : "border-border"
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-md border",
                  createStarter ? "border-accent bg-accent text-background" : "border-border"
                )}
              >
                {createStarter && <span className="text-xs">✓</span>}
              </div>
              <div>
                <p className="text-sm font-medium">Crear mi flujo inicial</p>
                <p className="text-xs text-muted">Podrás editarlo después en Flujos</p>
              </div>
            </button>
          </div>
        )}

        {step === 5 && (
          <Card className="p-5">
            <p className="text-sm leading-relaxed text-secondary">
              Recibe alertas cuando un amigo te envíe una rutina, comente o dé like a tus
              entrenamientos.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Button size="lg" onClick={() => finish(true)} disabled={loading}>
                {loading ? "Preparando…" : "Activar notificaciones"}
              </Button>
              <Button variant="ghost" size="lg" onClick={() => finish(false)} disabled={loading}>
                Ahora no
              </Button>
            </div>
          </Card>
        )}

        {!isLast && (
          <div className="mt-8">
            <Button
              size="lg"
              disabled={!canContinue}
              onClick={() => setStep((s) => s + 1)}
              className="gap-2"
            >
              Continuar
              <ChevronRight size={18} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
