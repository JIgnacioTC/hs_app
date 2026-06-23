"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Bell, User, Globe, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { api, subscribeToPush } from "@/lib/api-client";
import { FOCUS_AREAS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { IDENTITY_PREFIX } from "@/styles/branding";

const STEPS = [
  { icon: User, title: "Tu nombre", subtitle: "¿Cómo te llamamos?" },
  { icon: Sparkles, title: "Tu identidad", subtitle: "¿En quién te estás convirtiendo?" },
  { icon: Globe, title: "Zona horaria", subtitle: "Para recordatorios precisos" },
  { icon: Target, title: "Enfoque", subtitle: "¿En qué quieres mejorar?" },
  { icon: Bell, title: "Notificaciones", subtitle: "Recordatorios en tu celular" },
];

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [identityStatement, setIdentityStatement] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggleFocus(area: string) {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  async function finish(enablePush: boolean) {
    setLoading(true);
    try {
      await api.patch("/api/profile", {
        display_name: displayName,
        identity_statement: identityStatement
          ? `${IDENTITY_PREFIX} ${identityStatement}`
          : "",
        timezone,
        focus_areas: focusAreas,
        wizard_completed: true,
      });

      if (enablePush) {
        await subscribeToPush();
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  const StepIcon = STEPS[step].icon;
  const isLast = step === STEPS.length - 1;

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
        )}

        {step === 1 && (
          <div>
            <p className="mb-2 text-xs text-muted">{IDENTITY_PREFIX}…</p>
            <Textarea
              placeholder="…priorizo mi salud y mis sistemas diarios"
              value={identityStatement}
              onChange={(e) => setIdentityStatement(e.currentTarget.value)}
              rows={4}
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <Label htmlFor="tz">Zona horaria</Label>
            <Input
              id="tz"
              value={timezone}
              onChange={(e) => setTimezone(e.currentTarget.value)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-wrap gap-2">
            {FOCUS_AREAS.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => toggleFocus(area)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-all",
                  focusAreas.includes(area)
                    ? "border-accent-soft bg-accent/10 text-accent"
                    : "border-border text-muted hover:border-accent-soft/50"
                )}
              >
                {area}
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <Card className="p-5">
            <p className="text-sm leading-relaxed text-secondary">
              Activa push para recordatorios de hábitos y gym, incluso con la app cerrada.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Button size="lg" onClick={() => finish(true)} disabled={loading}>
                {loading ? "Configurando…" : "Activar notificaciones"}
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
              disabled={step === 0 && !displayName.trim()}
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
