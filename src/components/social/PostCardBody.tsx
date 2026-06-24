import type { SocialPost } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PostCardBody({ post, className }: { post: SocialPost; className?: string }) {
  if (post.kind === "workout") {
    return (
      <div className={className}>
        <p className="text-lg font-semibold tracking-tight">{post.routine_name}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-secondary">
          <span>{formatDuration(post.duration_seconds)}</span>
          <span>{post.exercise_count ?? 0} ejercicios</span>
          <span>{post.set_count ?? 0} series</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {post.body && <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>}
      {post.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.image_url} alt="" className="max-h-80 w-full rounded-2xl object-cover" />
      )}
    </div>
  );
}
