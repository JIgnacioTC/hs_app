"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PostComposer } from "@/components/social/PostComposer";
import { PostCardBody } from "@/components/social/PostCardBody";
import { ThreadSheet } from "@/components/social/ThreadSheet";
import { api } from "@/lib/api-client";
import type { SocialPost } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SocialFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadId = searchParams.get("thread");

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getStale<SocialPost[]>("/api/social/feed");
      setPosts(data);
      setLoading(false);

      void api.get<SocialPost[]>("/api/social/feed").then((fresh) => {
        setPosts(fresh);
        setLoading(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el feed");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function closeThread() {
    router.replace("/social?tab=feed", { scroll: false });
  }

  function openThread(postId: string) {
    router.replace(`/social?tab=feed&thread=${postId}`, { scroll: false });
  }

  function prependPost(post: SocialPost) {
    setPosts((prev) => [post, ...prev.filter((p) => p.id !== post.id)]);
  }

  function patchLike(postId: string, liked: boolean) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked_by_me: liked,
              like_count: Math.max(0, p.like_count + (liked ? 1 : -1)),
            }
          : p
      )
    );
  }

  async function toggleLike(postId: string) {
    setActionError(null);
    try {
      const res = await api.post<{ liked: boolean }>(`/api/social/posts/${postId}/like`);
      patchLike(postId, res.liked);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo dar me gusta");
    }
  }

  function bumpReplyCount(rootId: string) {
    setPosts((prev) =>
      prev.map((p) => (p.id === rootId ? { ...p, reply_count: p.reply_count + 1 } : p))
    );
  }

  return (
    <>
      <div className="space-y-4 pb-4">
        <PostComposer onPosted={prependPost} />

        {actionError && (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">{actionError}</p>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-[20px] bg-surface-muted" />
            ))}
          </div>
        )}

        {error && !loading && (
          <Card className="p-6 text-center text-sm text-danger">{error}</Card>
        )}

        {!loading && !error && !posts.length && (
          <Card className="p-8 text-center">
            <p className="font-medium">Sin actividad todavía</p>
            <p className="mt-2 text-sm text-muted">
              Publica algo arriba o completa una rutina para verla aquí.
            </p>
          </Card>
        )}

        {posts.map((post) => (
          <Card key={post.id} className="p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{post.author_name}</p>
                <p className="text-xs text-muted">{formatWhen(post.created_at)}</p>
              </div>
              {post.kind === "workout" ? (
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] text-accent">
                  Rutina
                </span>
              ) : (
                <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[10px] text-muted">
                  Post
                </span>
              )}
            </div>

            <PostCardBody post={post} />

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
                onClick={() => openThread(post.id)}
                className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
              >
                <MessageCircle size={18} />
                {post.reply_count || "Responder"}
              </button>
            </div>
          </Card>
        ))}
      </div>

      {threadId && (
        <ThreadSheet
          postId={threadId}
          onClose={closeThread}
          onLikeToggle={patchLike}
          onReplyAdded={bumpReplyCount}
        />
      )}
    </>
  );
}
