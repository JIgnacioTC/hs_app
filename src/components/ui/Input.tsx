import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-border bg-surface-raised px-4 text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent-soft",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[5rem] w-full resize-none rounded-2xl border border-border bg-surface-raised px-4 py-3 text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent-soft",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("grok-label mb-2 block", className)} {...props} />
  );
}
