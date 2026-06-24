"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api-client";
import type { WorkoutPost } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WorkoutFeed() {
  const [posts, setPosts] = useState<WorkoutPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.get<WorkoutPost[]>("/api/social/feed");
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleLike(postId: string) {
    const res = await api.post<{ liked: boolean }>(`/api/social/posts/${postId}/like`);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked_by_me: res.liked,
              like_count: Math.max(0, p.like_count + (res.liked ? 1 : -1)),
            }
          : p
      )
    );
  }

  async function submitComment(postId: string) {
    const body = (commentDraft[postId] ?? "").trim();
    if (!body) return;

    const comment = await api.post(`/api/social/posts/${postId}/comments`, { body });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, comment as WorkoutPost["comments"][0]] } : p
      )
    );
    setCommentDraft((prev) => ({ ...prev, [postId]: "" }));
    setOpenComments((prev) => new Set(prev).add(postId));
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-[20px] bg-surface-muted" />
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium">Sin actividad de amigos</p>
        <p className="mt-2 text-sm text-muted">
          Cuando tus amigos completen rutinas, aparecerán aquí.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {posts.map((post) => {
        const commentsOpen = openComments.has(post.id) || post.comments.length > 0;
        return (
          <Card key={post.id} className="p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{post.author_name}</p>
                <p className="text-xs text-muted">{formatWhen(post.created_at)}</p>
              </div>
              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] text-accent">
                Rutina
              </span>
            </div>

            <p className="text-lg font-semibold tracking-tight">{post.routine_name}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-secondary">
              <span>{formatDuration(post.duration_seconds)}</span>
              <span>{post.exercise_count} ejercicios</span>
              <span>{post.set_count} series</span>
            </div>

            <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => void toggleLike(post.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 text-sm transition-colors",
                  post.liked_by_me ? "text-accent" : "text-muted"
                )}
              >
                <Heart size={18} fill={post.liked_by_me ? "currentColor" : "none"} />
                {post.like_count || "Me gusta"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setOpenComments((prev) => {
                    const next = new Set(prev);
                    if (next.has(post.id)) next.delete(post.id);
                    else next.add(post.id);
                    return next;
                  })
                }
                className="inline-flex items-center gap-1.5 text-sm text-muted"
              >
                <MessageCircle size={18} />
                {post.comments.length || "Comentar"}
              </button>
            </div>

            {commentsOpen && (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                {post.comments.map((c) => (
                  <div key={c.id} className="rounded-xl bg-surface-muted px-3 py-2">
                    <p className="text-xs font-medium">{c.author_name}</p>
                    <p className="text-sm text-secondary">{c.body}</p>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Escribe un comentario…"
                    value={commentDraft[post.id] ?? ""}
                    onChange={(e) =>
                      setCommentDraft((prev) => ({ ...prev, [post.id]: e.currentTarget.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void submitComment(post.id);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void submitComment(post.id)}
                    className="shrink-0 rounded-xl border border-border px-3 text-muted"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
