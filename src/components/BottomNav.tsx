"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Home, ListChecks, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Hoy", icon: Home },
  { href: "/habits", label: "Sistema", icon: ListChecks },
  { href: "/gym", label: "Flujo", icon: Dumbbell },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-surface/90 backdrop-blur-xl safe-bottom">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[4.5rem] flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs transition-colors duration-200",
                active ? "text-accent" : "text-muted hover:text-secondary"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
