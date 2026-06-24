"use client";

import { useState } from "react";
import { ImagePlus, Send } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api-client";
import type { SocialPost } from "@/lib/types";

interface PostComposerProps {
  onPosted: (post: SocialPost) => void;
}

export function PostComposer({ onPosted }: PostComposerProps) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const text = body.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const post = await api.post<SocialPost>("/api/social/posts", { body: text });
      onPosted(post);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.currentTarget.value)}
        placeholder="¿Qué estás entrenando hoy?"
        rows={3}
        maxLength={2000}
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted"
      />
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        <button
          type="button"
          disabled
          title="Próximamente"
          className="inline-flex items-center gap-1.5 text-xs text-muted opacity-50"
        >
          <ImagePlus size={16} />
          Foto
        </button>
        <Button size="sm" disabled={!body.trim() || submitting} onClick={() => void submit()}>
          <Send size={14} className="mr-1.5" />
          Publicar
        </Button>
      </div>
    </Card>
  );
}
