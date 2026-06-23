import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-border bg-surface transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
