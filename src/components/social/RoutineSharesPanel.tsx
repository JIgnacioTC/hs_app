"use client";

import { useCallback, useEffect, useState } from "react";
import { Dumbbell } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api-client";
import type { RoutineShare } from "@/lib/types";

export function RoutineSharesPanel() {
  const [received, setReceived] = useState<RoutineShare[]>([]);
  const [sent, setSent] = useState<RoutineShare[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [r, s] = await Promise.all([
      api.get<RoutineShare[]>("/api/social/routines/shares?direction=received"),
      api.get<RoutineShare[]>("/api/social/routines/shares?direction=sent"),
    ]);
    setReceived(r);
    setSent(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function formatWhen(iso: string) {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-[20px] bg-surface-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <section>
        <p className="grok-label mb-3">Recibidas</p>
        {received.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted">
            Cuando un amigo te envíe una rutina, aparecerá aquí y en tus Flujos.
          </Card>
        ) : (
          <div className="space-y-2">
            {received.map((share) => (
              <Card key={share.id} className="flex items-start gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Dumbbell size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{share.routine_name}</p>
                  <p className="text-sm text-secondary">De {share.peer_name}</p>
                  <p className="mt-1 text-xs text-muted">{formatWhen(share.created_at)}</p>
                  <p className="mt-2 text-xs text-accent">Ya está en Flujos</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="grok-label mb-3">Enviadas</p>
        {sent.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted">
            Comparte una rutina desde la pestaña Flujos con el botón enviar.
          </Card>
        ) : (
          <div className="space-y-2">
            {sent.map((share) => (
              <Card key={share.id} className="flex items-start gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-muted">
                  <Dumbbell size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{share.routine_name}</p>
                  <p className="text-sm text-secondary">Para {share.peer_name}</p>
                  <p className="mt-1 text-xs text-muted">{formatWhen(share.created_at)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
