"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import {
  BodyProfileForm,
  bodyProfileFromApi,
  bodyProfileToPayload,
  EMPTY_BODY_PROFILE,
  isBodyProfileFormValid,
  type BodyProfileFormValues,
} from "@/components/settings/BodyProfileForm";
import { FitnessInsightsCard } from "@/components/settings/FitnessInsightsCard";
import { api } from "@/lib/api-client";
import type { FitnessInsights, UserFitnessProfile } from "@/lib/fitness/profile";

interface FitnessResponse {
  profile: UserFitnessProfile | null;
  insights: FitnessInsights;
  complete: boolean;
}

export function FitnessProfilePanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [insights, setInsights] = useState<FitnessInsights | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [body, setBody] = useState<BodyProfileFormValues>(EMPTY_BODY_PROFILE);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, fitnessRes] = await Promise.all([
        api.get<{ display_name: string }>("/api/profile"),
        api.get<FitnessResponse>("/api/profile/fitness"),
      ]);
      setDisplayName(profileRes.display_name ?? "");
      setBody(bodyProfileFromApi(fitnessRes.profile));
      setInsights(fitnessRes.insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el perfil");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.patch("/api/profile", {
        display_name: displayName.trim() || "Atleta",
      });
      const fitness = await api.patch<FitnessResponse>(
        "/api/profile/fitness",
        bodyProfileToPayload(body)
      );
      setInsights(fitness.insights);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-[20px] bg-surface-muted" />
        <div className="h-64 animate-pulse rounded-[20px] bg-surface-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 grok-label">Datos básicos</h2>
        <Card className="space-y-4 p-4">
          <div>
            <Label htmlFor="display-name">Nombre</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.currentTarget.value)}
              placeholder="Tu nombre"
            />
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 grok-label">Perfil físico</h2>
        <Card className="p-4">
          <p className="mb-4 text-sm text-secondary">
            Usamos estos datos para estimar tu condición, gasto calórico y qué tipo de
            entrenamiento te conviene más.
          </p>
          <BodyProfileForm values={body} onChange={setBody} />
        </Card>
      </section>

      {insights && <FitnessInsightsCard insights={insights} />}

      {error && <p className="text-xs text-danger">{error}</p>}
      {saved && <p className="text-xs text-success">Perfil guardado</p>}

      <Button
        size="lg"
        className="w-full"
        disabled={saving || !isBodyProfileFormValid(body)}
        onClick={() => void save()}
      >
        {saving ? "Guardando…" : "Guardar perfil"}
      </Button>
    </div>
  );
}
