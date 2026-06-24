"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FlowCard } from "@/components/gym/FlowCard";
import { FlowForge } from "@/components/gym/FlowForge";
import { FlowEditor } from "@/components/gym/FlowEditor";
import { SessionRunner } from "@/components/gym/SessionRunner";
import { GymTabs, type GymTab } from "@/components/gym/GymTabs";
import { ExerciseBrowser } from "@/components/gym/ExerciseBrowser";
import { WorkoutHistoryPanel } from "@/components/gym/WorkoutHistoryPanel";
import { api } from "@/lib/api-client";
import type { Flow, FlowDraftStep } from "@/lib/gym/flow";
import type { GymSession } from "@/lib/types";
import type { PlannedSet } from "@/lib/gym/sets";

interface ActiveSession {
  session: GymSession;
  flow: Flow;
}

function GymPageInner() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<GymTab>("flows");
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forging, setForging] = useState(false);
  const [editing, setEditing] = useState<Flow | null>(null);
  const [active, setActive] = useState<ActiveSession | null>(null);

  const load = useCallback(async () => {
    const r = await api.get<Flow[]>("/api/gym/routines");
    setFlows(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createFlow(data: {
    name: string;
    mood: string;
    steps: FlowDraftStep[];
  }) {
    const routine = await api.post<Flow>("/api/gym/routines", {
      name: data.name,
      description: data.mood,
    });

    for (let i = 0; i < data.steps.length; i++) {
      const step = data.steps[i];
      await api.post("/api/gym/exercises", {
        routine_id: routine.id,
        exercise_catalog_id: step.catalogId,
        sort_order: i,
        planned_sets: step.planned_sets,
      });
    }

    setForging(false);
    await load();
  }

  async function addStep(flowId: string, catalogId: string, planned_sets: PlannedSet[]) {
    const flow = flows.find((f) => f.id === flowId);
    const order = flow?.gym_exercises?.length ?? 0;
    await api.post("/api/gym/exercises", {
      routine_id: flowId,
      exercise_catalog_id: catalogId,
      sort_order: order,
      planned_sets,
    });
    await refreshEditing(flowId);
  }

  async function updateSets(exerciseId: string, sets: PlannedSet[]) {
    await api.put(`/api/gym/exercises/${exerciseId}/sets`, { sets });
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
    const startId = searchParams.get("start");
    if (!startId || loading || active) return;
    const flow = flows.find((f) => f.id === startId);
    if (flow) void startSession(flow);
  }, [searchParams, loading, flows, active]);

  async function startSession(flow: Flow) {
    const data = await api.post<{ session: GymSession; routine: Flow }>(
      "/api/gym/sessions",
      { routine_id: flow.id }
    );
    setActive({ session: data.session, flow: data.routine });
  }

  async function completeSession() {
    if (!active) return;
    await api.patch(`/api/gym/sessions/${active.session.id}`, { status: "completed" });
    setActive(null);
    await load();
  }

  async function abandonSession() {
    if (!active) return;
    await api.patch(`/api/gym/sessions/${active.session.id}`, { status: "abandoned" });
    setActive(null);
  }

  if (forging) {
    return <FlowForge onSave={createFlow} onCancel={() => setForging(false)} />;
  }

  if (editing) {
    return (
      <FlowEditor
        flow={editing}
        onAddStep={(catalogId, sets) => addStep(editing.id, catalogId, sets)}
        onUpdateSets={updateSets}
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
        onComplete={completeSession}
        onExit={abandonSession}
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

      <GymTabs active={tab} onChange={setTab} />

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
                  onStart={() => startSession(flow)}
                  onEdit={() => setEditing(flow)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "history" && <WorkoutHistoryPanel />}

      {tab === "exercises" && <ExerciseBrowser />}
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
