"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, ScanLine, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QrScannerModal } from "@/components/social/QrScannerModal";
import { api } from "@/lib/api-client";
import { friendAddUrl } from "@/lib/social/friends";
import type { FriendProfile, Profile } from "@/lib/types";

interface ProfileQrCardProps {
  profile: Profile;
  friends: FriendProfile[];
  onFriendAdded: () => void;
}

export function ProfileQrCard({ profile, friends, onFriendAdded }: ProfileQrCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const origin = globalThis.location?.origin ?? "";
    if (!origin) return;
    const url = friendAddUrl(origin, profile.id);
    void QRCode.toDataURL(url, {
      width: 220,
      margin: 1,
      color: { dark: "#ffffff", light: "#00000000" },
    }).then(setQrDataUrl);
  }, [profile.id]);

  async function addFriend(friendId: string) {
    setAdding(true);
    setMessage(null);
    try {
      const res = await api.post<{ ok: boolean; already?: boolean; friend: FriendProfile }>(
        "/api/social/friends",
        { friend_id: friendId }
      );
      setMessage(
        res.already
          ? `${res.friend.display_name} ya es tu amigo`
          : `${res.friend.display_name} añadido`
      );
      onFriendAdded();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo añadir");
    } finally {
      setAdding(false);
      setScannerOpen(false);
    }
  }

  return (
    <>
      <Card className="mb-6 p-4">
        <p className="grok-label mb-1">Tu perfil</p>
        <p className="text-lg font-semibold">{profile.display_name}</p>
        <p className="mt-1 text-xs text-muted">Comparte tu QR para que te añadan</p>

        <div className="mt-4 flex flex-col items-center">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="QR para añadir amigo"
              className="rounded-2xl border border-border bg-surface p-3"
            />
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center rounded-2xl border border-border bg-surface-muted">
              <QrCode className="text-muted" />
            </div>
          )}
        </div>

        <Button
          className="mt-4 w-full gap-2"
          variant="outline"
          onClick={() => setScannerOpen(true)}
          disabled={adding}
        >
          <ScanLine size={16} />
          Añadir amigo con QR
        </Button>

        {message && <p className="mt-3 text-center text-sm text-accent">{message}</p>}
      </Card>

      {friends.length > 0 && (
        <section>
          <p className="grok-label mb-3">Tus amigos ({friends.length})</p>
          <div className="space-y-2">
            {friends.map((friend) => (
              <Card key={friend.id} className="flex items-center gap-3 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-sm font-medium text-accent">
                  {friend.display_name.slice(0, 1).toUpperCase()}
                </div>
                <p className="font-medium">{friend.display_name}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {friends.length === 0 && (
        <Card className="flex flex-col items-center p-8 text-center">
          <UserPlus size={28} className="mb-3 text-muted" />
          <p className="text-sm text-muted">Aún no tienes amigos. Escanea un QR o comparte el tuyo.</p>
        </Card>
      )}

      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(friendId) => void addFriend(friendId)}
      />
    </>
  );
}
