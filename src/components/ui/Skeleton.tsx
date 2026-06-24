import { cn } from "@/lib/utils";

export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return <div className={cn("skeleton-shimmer rounded-2xl bg-surface-muted", className)} />;
}

export function DashboardSkeleton() {
  return (
    <div className="animate-fade-in pt-4" aria-hidden>
      <Skeleton className="mb-2 h-3 w-24" />
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-4 w-full max-w-xs" />

      <div className="mb-5 grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-[20px]" />
        ))}
      </div>

      <Skeleton className="mb-5 h-28 rounded-[20px]" />
      <Skeleton className="mb-5 h-24 rounded-[20px]" />

      <Skeleton className="mb-3 h-3 w-28" />
      <div className="mb-6 grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-[20px]" />
        ))}
      </div>

      <Skeleton className="mb-3 h-3 w-20" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}

export function FlowListSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in" aria-hidden>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-36 rounded-[20px]" />
      ))}
    </div>
  );
}

export function ExerciseListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-fade-in" aria-hidden>
      <Skeleton className="mb-3 h-3 w-32" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-[20px] border border-border bg-surface p-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SocialFeedSkeleton() {
  return (
    <div className="space-y-3 animate-fade-in" aria-hidden>
      <Skeleton className="h-24 rounded-[20px]" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-40 rounded-[20px]" />
      ))}
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in pt-4" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-16 rounded-[20px]" />
      <Skeleton className="h-32 rounded-[20px]" />
      <Skeleton className="h-14 rounded-[20px]" />
    </div>
  );
}
