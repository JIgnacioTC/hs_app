"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Link2, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { parseFriendIdFromQr, requestCameraStream, stopMediaStream } from "@/lib/social/friends";

interface QrScannerModalProps {
  open: boolean;
  initialStream?: MediaStream | null;
  onClose: () => void;
  onScan: (friendId: string) => void;
}

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

type VideoEl = HTMLVideoElement & {
  muted?: boolean;
  playsInline?: boolean;
  srcObject?: MediaStream | null;
  play: () => Promise<void>;
};

function getBarcodeDetector(): BarcodeDetectorLike | null {
  const g = globalThis as typeof globalThis & {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
  };
  if (!g.BarcodeDetector) return null;
  try {
    return new g.BarcodeDetector({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

async function pickCameraId(): Promise<string | { facingMode: string }> {
  const { Html5Qrcode } = await import("html5-qrcode");
  const cameras = await Html5Qrcode.getCameras();
  if (!cameras.length) return { facingMode: "environment" };

  const back =
    cameras.find((c) => /back|rear|environment|trás|trasera/i.test(c.label)) ??
    cameras[cameras.length - 1];
  return back.id;
}

export function QrScannerModal({ open, initialStream, onClose, onScan }: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const onScanRef = useRef(onScan);
  const handledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [starting, setStarting] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  onScanRef.current = onScan;

  const finishScan = useCallback((friendId: string) => {
    if (handledRef.current) return;
    handledRef.current = true;
    onScanRef.current(friendId);
  }, []);

  const tryManual = useCallback(() => {
    const friendId = parseFriendIdFromQr(manual);
    if (!friendId) {
      setError("Enlace o código no válido");
      return;
    }
    finishScan(friendId);
  }, [manual, finishScan]);

  useEffect(() => {
    if (!open) return;

    handledRef.current = false;
    setError(null);
    setManual("");
    setStarting(true);
    setUseFallback(false);

    let active = true;
    let stream = initialStream ?? null;
    let ownsStream = !initialStream;
    let raf = 0;
    let html5Scanner: { stop: () => Promise<void> } | null = null;

    async function attachStream(mediaStream: MediaStream) {
      const video = videoRef.current as VideoEl | null;
      if (!video) throw new Error("No se pudo iniciar la vista previa");

      video.muted = true;
      video.playsInline = true;
      video.srcObject = mediaStream;
      await video.play();
    }

    async function startHtml5Fallback() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!active || !fallbackRef.current) return;

      stopMediaStream(stream);
      stream = null;
      setUseFallback(true);

      const regionId = "hs-qr-reader";

      const scanner = new Html5Qrcode(regionId, { verbose: false });
      html5Scanner = scanner;
      const camera = await pickCameraId();

      await scanner.start(
        camera,
        {
          fps: 10,
          qrbox: (w, h) => {
            const size = Math.floor(Math.min(w, h) * 0.75);
            return { width: size, height: size };
          },
          aspectRatio: 1,
        },
        (decoded) => {
          const friendId = parseFriendIdFromQr(decoded);
          if (friendId) finishScan(friendId);
        },
        () => {}
      );
    }

    async function start() {
      try {
        if (!stream) {
          stream = await requestCameraStream();
          ownsStream = true;
        }

        if (!active) return;

        await attachStream(stream);

        const detector = getBarcodeDetector();
        if (detector && videoRef.current) {
          const tick = async () => {
            if (!active || handledRef.current || !videoRef.current) return;
            const video = videoRef.current as VideoEl;
            if (!video.srcObject) return;
            try {
              const codes = await detector.detect(video as unknown as ImageBitmapSource);
              for (const code of codes) {
                if (!code.rawValue) continue;
                const friendId = parseFriendIdFromQr(code.rawValue);
                if (friendId) {
                  finishScan(friendId);
                  return;
                }
              }
            } catch {
              // skip frame
            }
            raf = globalThis.requestAnimationFrame(() => void tick());
          };
          raf = globalThis.requestAnimationFrame(() => void tick());
        } else {
          await startHtml5Fallback();
        }
      } catch (err) {
        if (!active) return;
        try {
          await startHtml5Fallback();
        } catch {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo acceder a la cámara. Usa pegar enlace o subir imagen."
          );
        }
      } finally {
        if (active) setStarting(false);
      }
    }

    void start();

    return () => {
      active = false;
      globalThis.cancelAnimationFrame(raf);
      if (html5Scanner) void html5Scanner.stop().catch(() => {});
      if (ownsStream) stopMediaStream(stream);
    };
  }, [open, initialStream, finishScan]);

  async function scanFromFile(file: File) {
    setError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("hs-qr-file-scanner", { verbose: false });
      const decoded = await scanner.scanFile(file, true);
      const friendId = parseFriendIdFromQr(decoded);
      if (!friendId) {
        setError("No se encontró un código de amigo en la imagen");
        return;
      }
      finishScan(friendId);
    } catch {
      setError("No se pudo leer el QR de la imagen");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background">
      <div id="hs-qr-file-scanner" className="hidden" />

      <div className="flex items-center justify-between border-b border-border px-4 py-3 pt-safe">
        <p className="font-medium">Añadir amigo</p>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted">
          <X size={20} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="relative aspect-square w-full max-w-sm shrink-0 self-center overflow-hidden rounded-2xl border border-border bg-black">
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover ${useFallback ? "hidden" : ""}`}
            playsInline
            muted
            autoPlay
          />
          <div
            ref={fallbackRef}
            id="hs-qr-reader"
            className={`absolute inset-0 [&_video]:!h-full [&_video]:!w-full [&_video]:object-cover ${
              useFallback ? "" : "hidden"
            }`}
          />
          {starting && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 text-sm text-white">
              <Camera className="mr-2" size={18} />
              Iniciando cámara…
            </div>
          )}
          <div className="pointer-events-none absolute inset-6 z-10 rounded-2xl border-2 border-white/40" />
        </div>

        {error && <p className="text-center text-sm text-danger">{error}</p>}

        <p className="text-center text-xs text-muted">
          Apunta al QR (fondo blanco). En Mac puedes subir captura o pegar el enlace.
        </p>

        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const input = e.currentTarget as HTMLInputElement & { files?: FileList | null };
              const file = input.files?.[0];
              if (file) void scanFromFile(file);
              input.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() =>
              (fileInputRef.current as (HTMLInputElement & { click?: () => void }) | null)?.click?.()
            }
          >
            <ImageUp size={16} />
            Subir imagen del QR
          </Button>

          <div className="flex gap-2">
            <Input
              placeholder="Pega enlace o UUID"
              value={manual}
              onChange={(e) => setManual(e.currentTarget.value)}
            />
            <Button type="button" variant="outline" onClick={tryManual} className="shrink-0 gap-1">
              <Link2 size={16} />
              OK
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function openQrScannerWithCamera(): Promise<MediaStream | null> {
  try {
    return await requestCameraStream();
  } catch {
    return null;
  }
}
