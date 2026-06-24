"use client";

import { useCallback, useEffect, useState } from "react";
import { ProfileQrCard } from "@/components/social/ProfileQrCard";
import { api } from "@/lib/api-client";
import type { FriendProfile, Profile } from "@/lib/types";

export function FriendsPanel({ addUserId }: { addUserId?: string | null }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoAddMessage, setAutoAddMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, f] = await Promise.all([
      api.get<Profile>("/api/profile"),
      api.get<FriendProfile[]>("/api/social/friends"),
    ]);
    setProfile(p);
    setFriends(f);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!addUserId || loading || !profile) return;
    if (addUserId === profile.id) {
      setAutoAddMessage("Ese QR es el tuyo");
      return;
    }

    void (async () => {
      try {
        const res = await api.post<{ ok: boolean; already?: boolean; friend: FriendProfile }>(
          "/api/social/friends",
          { friend_id: addUserId }
        );
        setAutoAddMessage(
          res.already
            ? `${res.friend.display_name} ya es tu amigo`
            : `${res.friend.display_name} añadido`
        );
        await load();
      } catch (err) {
        setAutoAddMessage(err instanceof Error ? err.message : "No se pudo añadir");
      }
    })();
  }, [addUserId, loading, profile, load]);

  if (loading || !profile) {
    return <div className="h-48 animate-pulse rounded-[20px] bg-surface-muted" />;
  }

  return (
    <>
      {autoAddMessage && (
        <p className="mb-4 rounded-xl border border-accent/20 bg-accent/10 px-3 py-2 text-sm text-accent">
          {autoAddMessage}
        </p>
      )}
      <ProfileQrCard profile={profile} friends={friends} onFriendAdded={load} />
    </>
  );
}
