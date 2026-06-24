"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { parseFriendIdFromQr } from "@/lib/social/friends";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (friendId: string) => void;
}

export function QrScannerModal({ open, onClose, onScan }: QrScannerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function start() {
      setError(null);
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled || !containerRef.current) return;

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            const friendId = parseFriendIdFromQr(decoded);
            if (friendId) {
              void scanner.stop().then(() => {
                scannerRef.current = null;
                onScan(friendId);
              });
            }
          },
          () => {}
        );
      } catch {
        if (!cancelled) {
          setError("No se pudo acceder a la cámara. Comprueba los permisos.");
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        void scannerRef.current.stop();
        scannerRef.current = null;
      }
    };
  }, [open, onScan]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 pt-safe">
        <p className="font-medium">Escanear QR</p>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted">
          <X size={20} />
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div id="qr-reader" ref={containerRef} className="w-full max-w-sm overflow-hidden rounded-2xl" />
        {error && <p className="mt-4 text-center text-sm text-danger">{error}</p>}
        <p className="mt-4 max-w-xs text-center text-xs text-muted">
          Apunta al código QR del perfil de tu amigo
        </p>
      </div>
    </div>
  );
}
