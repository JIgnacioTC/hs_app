"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FlowCard } from "@/components/gym/FlowCard";
import { FlowForge } from "@/components/gym/FlowForge";
import { FlowEditor } from "@/components/gym/FlowEditor";
import { SessionRunner } from "@/components/gym/SessionRunner";
import { GymTabs, type GymTab } from "@/components/gym/GymTabs";
import { ExerciseBrowser } from "@/components/gym/ExerciseBrowser";
import { WorkoutHistoryPanel } from "@/components/gym/WorkoutHistoryPanel";
import { api } from "@/lib/api-client";
import { sessionDetailToFlow } from "@/lib/gym/session-resume";
import type { Flow, FlowDraftStep } from "@/lib/gym/flow";
import type { SetLog } from "@/lib/gym/sets";
import type { GymSession } from "@/lib/types";
import type { PlannedSet } from "@/lib/gym/sets";

interface ActiveSession {
  session: GymSession;
  flow: Flow;
  logs: SetLog[];
}

type SessionDetail = GymSession & {
  gym_routines?: Flow;
  set_logs?: SetLog[];
};

function GymPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<GymTab>("flows");
  const [flows, setFlows] = useState<Flow[]>([]);
  const [sessions, setSessions] = useState<GymSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [forging, setForging] = useState(false);
  const [editing, setEditing] = useState<Flow | null>(null);
  const [active, setActive] = useState<ActiveSession | null>(null);
  const [pendingFlow, setPendingFlow] = useState<Flow | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([
        api.get<Flow[]>("/api/gym/routines"),
        api.get<GymSession[]>("/api/gym/sessions"),
      ]);
      setFlows(r);
      setSessions(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeSession = sessions.find((s) => s.status === "active");

  const resumeSession = useCallback(async (sessionId: string) => {
    setStarting(true);
    setSessionError(null);
    try {
      const data = await api.get<SessionDetail>(`/api/gym/sessions/${sessionId}`);
      const flow = sessionDetailToFlow(data);
      setActive({
        session: data,
        flow,
        logs: data.set_logs ?? [],
      });
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : "No se pudo reanudar");
    } finally {
      setStarting(false);
    }
  }, []);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "history" || t === "exercises" || t === "flows") {
      setTab(t);
    }
    if (searchParams.get("forge") === "1") {
      setForging(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (loading || active) return;

    const startId = searchParams.get("start");
    if (startId) {
      const flow = flows.find((f) => f.id === startId);
      if (flow) void startSession(flow);
      return;
    }

    if (searchParams.get("resume") === "1" && activeSession) {
      void resumeSession(activeSession.id);
    }
  }, [searchParams, loading, flows, active, activeSession, resumeSession]);

  function changeTab(next: GymTab) {
    setTab(next);
    router.replace(`/gym?tab=${next}`, { scroll: false });
  }

  async function createFlow(data: {
    name: string;
    mood: string;
    steps: FlowDraftStep[];
  }) {
    setSessionError(null);
    try {
      await api.post<Flow>("/api/gym/routines", {
        name: data.name,
        description: data.mood,
        steps: data.steps.map((step) => ({
          exercise_catalog_id: step.catalogId,
          planned_sets: step.planned_sets,
        })),
      });
      setForging(false);
      await load();
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : "No se pudo crear el flujo");
    }
  }

  async function addStep(flowId: string, catalogId: string, planned_sets: PlannedSet[]) {
    await api.post("/api/gym/exercises", {
      routine_id: flowId,
      exercise_catalog_id: catalogId,
      planned_sets,
    });
    await refreshEditing(flowId);
  }

  async function updateSets(exerciseId: string, sets: PlannedSet[]) {
    await api.put(`/api/gym/exercises/${exerciseId}/sets`, { sets });
    if (editing) await refreshEditing(editing.id);
  }

  async function updateFlowMeta(flowId: string, patch: { name?: string; description?: string }) {
    const updated = await api.patch<Flow>(`/api/gym/routines/${flowId}`, patch);
    setEditing(updated);
    await load();
  }

  async function reorderExercise(exerciseId: string, sortOrder: number) {
    await api.patch(`/api/gym/exercises/${exerciseId}`, { sort_order: sortOrder });
    if (editing) await refreshEditing(editing.id);
  }

  async function refreshEditing(flowId: string) {
    const updated = await api.get<Flow[]>("/api/gym/routines");
    setFlows(updated);
    const fresh = updated.find((f) => f.id === flowId);
    if (fresh) setEditing(fresh);
  }

  async function removeStep(id: string) {
    await api.delete("/api/gym/exercises", { id });
    if (editing) await refreshEditing(editing.id);
    else await load();
  }

  async function deleteFlow(id: string) {
    await api.delete("/api/gym/routines", { id });
    setEditing(null);
    await load();
  }

  async function startSession(flow: Flow, force = false) {
    setSessionError(null);

    if (activeSession && activeSession.routine_id === flow.id) {
      await resumeSession(activeSession.id);
      return;
    }

    if (activeSession && !force) {
      setPendingFlow(flow);
      return;
    }

    setStarting(true);
    try {
      const data = await api.post<{ session: GymSession; routine: Flow }>(
        "/api/gym/sessions",
        { routine_id: flow.id }
      );
      setActive({ session: data.session, flow: data.routine, logs: [] });
      await load();
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setStarting(false);
    }
  }

  async function completeSession() {
    if (!active) return;
    await api.patch(`/api/gym/sessions/${active.session.id}`, { status: "completed" });
    setActive(null);
    await load();
    router.replace("/gym?tab=flows", { scroll: false });
  }

  async function abandonSession() {
    if (!active) return;
    await api.patch(`/api/gym/sessions/${active.session.id}`, { status: "abandoned" });
    setActive(null);
    await load();
    router.replace("/gym?tab=flows", { scroll: false });
  }

  function pauseSession() {
    setActive(null);
    router.replace("/gym?tab=flows", { scroll: false });
  }

  if (forging) {
    return (
      <>
        <FlowForge onSave={createFlow} onCancel={() => setForging(false)} />
        {sessionError && (
          <p className="fixed bottom-24 left-4 right-4 z-[100] rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">
            {sessionError}
          </p>
        )}
      </>
    );
  }

  if (editing) {
    return (
      <FlowEditor
        flow={editing}
        onAddStep={(catalogId, sets) => addStep(editing.id, catalogId, sets)}
        onUpdateSets={updateSets}
        onUpdateFlow={(patch) => updateFlowMeta(editing.id, patch)}
        onReorder={(exerciseId, order) => reorderExercise(exerciseId, order)}
        onRemoveStep={removeStep}
        onDeleteFlow={() => deleteFlow(editing.id)}
        onClose={() => setEditing(null)}
      />
    );
  }

  if (active) {
    return (
      <SessionRunner
        session={active.session}
        flow={active.flow}
        initialLogs={active.logs}
        onComplete={completeSession}
        onPause={pauseSession}
        onAbandon={abandonSession}
      />
    );
  }

  return (
    <AppShell>
      <header className="mb-4 pt-4">
        <p className="grok-label">Movimiento</p>
        <h1 className="text-2xl font-semibold tracking-tight">Flujos</h1>
        <p className="mt-1 text-sm text-secondary">
          Rutinas, historial y catálogo de ejercicios
        </p>
      </header>

      {activeSession && (
        <Card className="mb-4 border-accent/30 bg-accent/5 p-4">
          <p className="grok-label text-accent">Sesión en curso</p>
          <p className="mt-1 font-medium">
            {(activeSession.gym_routines as { name?: string } | undefined)?.name ?? "Rutina activa"}
          </p>
          <Button
            className="mt-3 w-full gap-2"
            disabled={starting}
            onClick={() => void resumeSession(activeSession.id)}
          >
            Continuar entrenamiento
          </Button>
        </Card>
      )}

      {sessionError && (
        <p className="mb-4 rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">{sessionError}</p>
      )}

      <GymTabs active={tab} onChange={changeTab} />

      {tab === "flows" && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="grok-label">Tus flujos</p>
            <Button size="sm" onClick={() => setForging(true)} className="gap-1">
              <Plus size={16} />
              Forjar
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-[20px] bg-surface-muted" />
              ))}
            </div>
          ) : flows.length === 0 ? (
            <Card className="p-10 text-center">
              <Sparkles size={32} className="mx-auto mb-4 text-accent-soft" />
              <p className="text-lg font-medium tracking-tight">Sin flujos aún</p>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
                Elige ejercicios del catálogo y configura tus series antes de entrenar.
              </p>
              <Button className="mt-8" onClick={() => setForging(true)}>
                Forjar tu primer flujo
              </Button>
            </Card>
          ) : (
            <div className="space-y-4 pb-4">
              {flows.map((flow) => (
                <FlowCard
                  key={flow.id}
                  flow={flow}
                  onStart={() => void startSession(flow)}
                  onEdit={() => setEditing(flow)}
                  starting={starting}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "history" && <WorkoutHistoryPanel />}

      {tab === "exercises" && <ExerciseBrowser />}

      <ConfirmDialog
        open={Boolean(pendingFlow)}
        title="¿Abandonar sesión anterior?"
        description="Tienes una sesión activa. Si inicias otra rutina, se abandonará el progreso anterior."
        confirmLabel="Abandonar e iniciar"
        cancelLabel="Cancelar"
        danger
        onConfirm={() => {
          const flow = pendingFlow;
          setPendingFlow(null);
          if (flow) void startSession(flow, true);
        }}
        onCancel={() => setPendingFlow(null)}
      />
    </AppShell>
  );
}

export default function GymPage() {
  return (
    <Suspense fallback={null}>
      <GymPageInner />
    </Suspense>
  );
}
