"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, LogOut, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { AdminExerciseGifUploadPanel } from "@/components/settings/AdminExerciseGifUploadPanel";
import { AdminExerciseImportPanel } from "@/components/settings/AdminExerciseImportPanel";
import { SettingsTabs, type SettingsTab } from "@/components/settings/SettingsTabs";
import { api, subscribeToPush, unsubscribeFromPush } from "@/lib/api-client";
import type { Profile, Reminder } from "@/lib/types";
import { CRON_PRESETS, describeCron } from "@/lib/cron";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<SettingsTab>("general");
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [customCron, setCustomCron] = useState("");
  const [cronPreset, setCronPreset] = useState("0 8 * * *");

  const load = useCallback(async () => {
    const [p, r, adminStatus] = await Promise.all([
      api.getStale<Profile>("/api/profile"),
      api.getStale<Reminder[]>("/api/reminders"),
      api.get<{ is_admin: boolean }>("/api/admin/status", { cache: false }),
    ]);
    setProfile(p);
    setReminders(r);
    setIsAdmin(adminStatus.is_admin);

    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setPushEnabled(!!sub);
    }

    void Promise.all([
      api.get<Profile>("/api/profile"),
      api.get<Reminder[]>("/api/reminders"),
    ]).then(([freshProfile, freshReminders]) => {
      setProfile(freshProfile);
      setReminders(freshReminders);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isAdmin && tab === "admin") {
      setTab("general");
    }
  }, [isAdmin, tab]);

  async function togglePush() {
    setPushError(null);
    if (pushEnabled) {
      await unsubscribeFromPush();
      setPushEnabled(false);
      return;
    }

    const { publicKey } = await api.get<{ publicKey: string }>("/api/push/subscribe");
    if (!publicKey) {
      setPushError(
        "Faltan las claves VAPID en Vercel. Añade NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY, luego redeploy."
      );
      return;
    }

    const ok = await subscribeToPush();
    if (!ok) {
      setPushError("No se pudo activar. Comprueba permisos del navegador y que estés en HTTPS.");
      return;
    }
    setPushEnabled(true);
  }

  async function createReminder(e: React.FormEvent) {
    e.preventDefault();
    const expression = cronPreset === "custom" ? customCron : cronPreset;
    await api.post("/api/reminders", {
      title,
      body,
      cron_expression: expression,
      timezone: profile?.timezone ?? "UTC",
    });
    setTitle("");
    setBody("");
    setShowForm(false);
    await load();
  }

  async function toggleReminder(id: string, enabled: boolean) {
    await api.patch("/api/reminders", { id, enabled: !enabled });
    await load();
  }

  async function deleteReminder(id: string) {
    await api.delete("/api/reminders", { id });
    await load();
  }

  async function logout() {
    await api.post("/api/auth/logout");
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <>
      <header className="mb-6 pt-4">
        <h1 className="text-2xl font-semibold">Ajustes</h1>
        <p className="text-sm text-muted">{profile?.display_name}</p>
        <Link
          href="/social"
          className="mt-2 inline-flex text-sm text-accent-soft underline"
        >
          Perfil social y amigos →
        </Link>
      </header>

      <SettingsTabs active={tab} onChange={setTab} showAdmin={isAdmin} />

      {tab === "admin" && isAdmin ? (
        <div className="space-y-8">
          <AdminExerciseGifUploadPanel />
          <AdminExerciseImportPanel />
        </div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">
              Notificaciones
            </h2>
            <Card className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {pushEnabled ? (
                  <Bell size={20} className="text-accent" />
                ) : (
                  <BellOff size={20} className="text-muted" />
                )}
                <div>
                  <p className="text-sm font-medium">Push en celular</p>
                  <p className="text-xs text-muted">
                    {pushEnabled ? "Activadas" : "Desactivadas"}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={togglePush}>
                {pushEnabled ? "Desactivar" : "Activar"}
              </Button>
            </Card>
            <p className="mt-2 text-xs text-muted">
              Alertas de rutinas compartidas, likes y comentarios en tus entrenamientos.
            </p>
            {pushError && <p className="mt-2 text-xs text-danger">{pushError}</p>}
          </section>

          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted">
                Recordatorios generales
              </h2>
              <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
                <Plus size={16} />
                Nuevo
              </Button>
            </div>

            {showForm && (
              <Card className="mb-4 p-4">
                <form onSubmit={createReminder} className="space-y-3">
                  <div>
                    <Label>Título</Label>
                    <Input
                      placeholder="Ej: Hora de meditar"
                      value={title}
                      onChange={(e) => setTitle(e.currentTarget.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Mensaje</Label>
                    <Textarea
                      placeholder="Mensaje de la notificación"
                      value={body}
                      onChange={(e) => setBody(e.currentTarget.value)}
                    />
                  </div>
                  <div>
                    <Label>Horario (cron)</Label>
                    <div className="flex flex-wrap gap-2">
                      {CRON_PRESETS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setCronPreset(p.value)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs transition-colors",
                            cronPreset === p.value
                              ? "border-accent bg-accent/15 text-accent"
                              : "border-border text-muted"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    {cronPreset === "custom" && (
                      <Input
                        className="mt-2 font-mono text-sm"
                        placeholder="0 8 * * *"
                        value={customCron}
                        onChange={(e) => setCustomCron(e.currentTarget.value)}
                      />
                    )}
                  </div>
                  <Button type="submit" size="lg">
                    Crear recordatorio
                  </Button>
                </form>
              </Card>
            )}

            <div className="space-y-2">
              {reminders.map((r) => (
                <Card key={r.id} className="flex items-center gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => toggleReminder(r.id, r.enabled)}
                    className={cn(
                      "h-5 w-9 shrink-0 rounded-full transition-colors",
                      r.enabled ? "bg-accent" : "bg-surface-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full bg-background transition-transform",
                        r.enabled ? "translate-x-4" : "translate-x-0.5"
                      )}
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted">{describeCron(r.cron_expression)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteReminder(r.id)}
                    className="p-2 text-muted hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </Card>
              ))}
              {reminders.length === 0 && (
                <Card className="p-6 text-center">
                  <p className="text-sm text-muted">Sin recordatorios configurados</p>
                </Card>
              )}
            </div>
          </section>

          <section>
            <Button variant="danger" size="lg" onClick={logout} className="gap-2">
              <LogOut size={18} />
              Cerrar sesión
            </Button>
          </section>
        </>
      )}
    </>
  );
}
