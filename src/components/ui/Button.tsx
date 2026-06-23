import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-40",
        {
          primary: "bg-accent text-background hover:opacity-90",
          ghost: "text-secondary hover:bg-surface-muted hover:text-foreground",
          outline:
            "border border-border text-foreground hover:border-accent-soft hover:text-accent",
          danger: "border border-danger/30 text-danger hover:bg-danger/10",
        }[variant],
        {
          sm: "h-9 px-4 text-sm",
          md: "h-11 px-6 text-sm",
          lg: "h-12 w-full px-6 text-base",
        }[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
