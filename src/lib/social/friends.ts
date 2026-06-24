import type { SupabaseClient } from "@supabase/supabase-js";

export async function getFriendIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("friendships")
    .select("user_id, friend_id")
    .eq("status", "accepted")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  if (error || !data) return [];

  return data.map((row) => (row.user_id === userId ? row.friend_id : row.user_id));
}

export async function areFriends(
  supabase: SupabaseClient,
  userId: string,
  otherId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("friendships")
    .select("id")
    .eq("status", "accepted")
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${otherId}),and(user_id.eq.${otherId},friend_id.eq.${userId})`
    )
    .maybeSingle();

  return !!data;
}

export function friendAddUrl(origin: string, userId: string) {
  return `${origin}/social?add=${userId}`;
}

export function parseFriendIdFromQr(text: string): string | null {
  const trimmed = text.trim();
  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get("add");
    if (fromQuery) return fromQuery;
    const match = url.pathname.match(
      /\/social\/add\/([0-9a-f-]{36})|[?&]add=([0-9a-f-]{36})/i
    );
    if (match) return match[1] ?? match[2] ?? null;
  } catch {
    // not a URL
  }

  const uuidMatch = trimmed.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  return uuidMatch?.[0] ?? null;
}

export function stopMediaStream(stream: MediaStream | null | undefined) {
  if (!stream) return;
  const s = stream as MediaStream & { getTracks?: () => Array<{ stop: () => void }> };
  s.getTracks?.().forEach((t) => t.stop());
}

export async function requestCameraStream(): Promise<MediaStream> {
  const nav = globalThis.navigator as typeof globalThis.navigator & {
    mediaDevices?: {
      getUserMedia: (c: unknown) => Promise<MediaStream>;
    };
  };
  const media = nav?.mediaDevices;
  if (!media?.getUserMedia) {
    throw new Error("Cámara no disponible en este navegador");
  }

  try {
    return await media.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
  } catch {
    return await media.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
  }
}
