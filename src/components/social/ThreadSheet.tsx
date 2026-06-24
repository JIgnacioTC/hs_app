"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Heart, Send, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { api } from "@/lib/api-client";
import type { SocialPost, SocialThread } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PostCardBody } from "@/components/social/PostCardBody";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ThreadSheetProps {
  postId: string;
  onClose: () => void;
  onLikeToggle: (postId: string, liked: boolean) => void;
  onReplyAdded: (rootId: string) => void;
}

function getPortalRoot(): HTMLElement | null {
  const g = globalThis as typeof globalThis & { document?: { body: HTMLElement | null } };
  return g.document?.body ?? null;
}

export function ThreadSheet({ postId, onClose, onLikeToggle, onReplyAdded }: ThreadSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [thread, setThread] = useState<SocialThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyTo, setReplyTo] = useState<SocialPost | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<SocialThread>(`/api/social/posts/${postId}/replies`);
      setThread(data);
      setReplyTo(data.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el hilo");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleLike(target: SocialPost) {
    try {
      const res = await api.post<{ liked: boolean }>(`/api/social/posts/${target.id}/like`);
      setThread((prev) => {
        if (!prev) return prev;
        const patch = (p: SocialPost) =>
          p.id === target.id
            ? {
                ...p,
                liked_by_me: res.liked,
                like_count: Math.max(0, p.like_count + (res.liked ? 1 : -1)),
              }
            : p;
        return { post: patch(prev.post), replies: prev.replies.map(patch) };
      });
      onLikeToggle(target.id, res.liked);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo dar me gusta");
    }
  }

  async function submitReply() {
    const text = replyDraft.trim();
    if (!text || !replyTo || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const reply = await api.post<SocialPost>(`/api/social/posts/${postId}/replies`, {
        body: text,
        parent_id: replyTo.id,
      });
      setThread((prev) => (prev ? { ...prev, replies: [...prev.replies, reply] } : prev));
      setReplyDraft("");
      onReplyAdded(postId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo responder");
    } finally {
      setSubmitting(false);
    }
  }

  const portalTarget = getPortalRoot();
  if (!mounted || !portalTarget) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex h-dvh max-h-dvh w-full flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 pt-safe">
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-surface-muted">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-semibold">Hilo</h2>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-full p-2 text-muted hover:bg-surface-muted"
        >
          <X size={18} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {loading && <div className="h-40 animate-pulse rounded-[20px] bg-surface-muted" />}
        {error && !loading && (
          <Card className="p-4 text-center text-sm text-danger">{error}</Card>
        )}
        {thread && (
          <div className="space-y-0 pb-4">
            <article className="border-b border-border pb-4">
              <PostHeader post={thread.post} />
              <PostCardBody post={thread.post} className="mt-2" />
              <PostActions post={thread.post} onLike={() => void toggleLike(thread.post)} />
            </article>

            {thread.replies.map((reply) => (
              <article key={reply.id} className="border-b border-border py-4 pl-4">
                <div className="relative before:absolute before:-left-4 before:top-0 before:h-full before:w-0.5 before:bg-border">
                  <PostHeader post={reply} compact />
                  <p className="mt-1 text-sm text-secondary">{reply.body}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void toggleLike(reply)}
                      className={cn(
                        "inline-flex items-center gap-1 text-xs",
                        reply.liked_by_me ? "text-accent" : "text-muted"
                      )}
                    >
                      <Heart size={14} fill={reply.liked_by_me ? "currentColor" : "none"} />
                      {reply.like_count || null}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyTo(reply)}
                      className="text-xs text-muted hover:text-accent"
                    >
                      Responder
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {thread && (
        <div className="shrink-0 border-t border-border bg-background p-4 safe-bottom">
          {replyTo && replyTo.id !== thread.post.id && (
            <p className="mb-2 text-xs text-muted">
              Respondiendo a <span className="text-accent">{replyTo.author_name}</span>
              <button type="button" className="ml-2 underline" onClick={() => setReplyTo(thread.post)}>
                Cancelar
              </button>
            </p>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              placeholder="Escribe una respuesta…"
              value={replyDraft}
              rows={2}
              className="min-h-[2.75rem] py-2"
              onChange={(e) => setReplyDraft(e.currentTarget.value)}
            />
            <button
              type="button"
              disabled={!replyDraft.trim() || submitting}
              onClick={() => void submitReply()}
              className="mb-0.5 shrink-0 rounded-xl border border-border px-3 py-3 text-muted disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>,
    portalTarget
  );
}

function PostHeader({ post, compact }: { post: SocialPost; compact?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className={cn("font-medium", compact && "text-sm")}>{post.author_name}</p>
        <p className="text-xs text-muted">{formatWhen(post.created_at)}</p>
      </div>
      {post.kind === "workout" && (
        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] text-accent">Rutina</span>
      )}
    </div>
  );
}

function PostActions({ post, onLike }: { post: SocialPost; onLike: () => void }) {
  return (
    <div className="mt-3 flex items-center gap-4">
      <button
        type="button"
        onClick={onLike}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm transition-colors",
          post.liked_by_me ? "text-accent" : "text-muted"
        )}
      >
        <Heart size={18} fill={post.liked_by_me ? "currentColor" : "none"} />
        {post.like_count || "Me gusta"}
      </button>
    </div>
  );
}
