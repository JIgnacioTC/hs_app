"use client";

import { useCallback, useEffect, useState } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api-client";
import type { FriendProfile } from "@/lib/types";

interface ShareRoutineSheetProps {
  open: boolean;
  routineId: string;
  routineName: string;
  onClose: () => void;
  onSent?: () => void;
}

export function ShareRoutineSheet({
  open,
  routineId,
  routineName,
  onClose,
  onSent,
}: ShareRoutineSheetProps) {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<FriendProfile[]>("/api/social/friends");
      setFriends(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setMessage(null);
      setError(null);
      void loadFriends();
    }
  }, [open, loadFriends]);

  async function sendTo(friendId: string, friendName: string) {
    setSending(friendId);
    setError(null);
    setMessage(null);
    try {
      await api.post("/api/social/routines/share", {
        routine_id: routineId,
        friend_id: friendId,
      });
      setMessage(`«${routineName}» enviada a ${friendName}`);
      onSent?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setSending(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/60" onClick={onClose}>
      <div
        className="absolute bottom-0 inset-x-0 max-h-[70vh] overflow-y-auto rounded-t-3xl border-t border-border bg-surface p-4 pb-8 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="grok-label">Compartir rutina</p>
            <p className="font-medium">{routineName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted">
            <X size={20} />
          </button>
        </div>

        {message && (
          <p className="mb-3 rounded-xl bg-success/10 px-3 py-2 text-sm text-success">{message}</p>
        )}
        {error && (
          <p className="mb-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        )}

        {loading ? (
          <div className="h-24 animate-pulse rounded-2xl bg-surface-muted" />
        ) : friends.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted">
            Añade amigos en Social → Amigos para compartir rutinas.
          </Card>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <Card key={friend.id} className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-sm font-medium text-accent">
                    {friend.display_name.slice(0, 1).toUpperCase()}
                  </div>
                  <p className="font-medium">{friend.display_name}</p>
                </div>
                <Button
                  size="sm"
                  className="gap-1"
                  disabled={sending === friend.id}
                  onClick={() => void sendTo(friend.id, friend.display_name)}
                >
                  <Send size={14} />
                  Enviar
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
