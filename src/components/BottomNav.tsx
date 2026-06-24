"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Home, Settings, Users } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/gym", label: "Flujos", icon: Dumbbell },
  { href: "/social", label: "Social", icon: Users },
  { href: "/settings", label: "Ajustes", icon: Settings },
] as const;

function prefetchTabData(href: string) {
  if (href === "/") {
    void api.getStale("/api/profile");
    void api.getStale("/api/gym/routines");
    void api.getStale("/api/gym/sessions");
    return;
  }
  if (href === "/gym") {
    void api.getStale("/api/gym/routines");
    void api.getStale("/api/gym/sessions");
    return;
  }
  if (href === "/settings") {
    void api.getStale("/api/profile");
    void api.getStale("/api/reminders");
    return;
  }
  if (href === "/social") {
    void api.getStale("/api/social/feed");
  }
}

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
              prefetch
              onMouseEnter={() => prefetchTabData(href)}
              onFocus={() => prefetchTabData(href)}
              onTouchStart={() => prefetchTabData(href)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] transition-colors duration-200",
                active ? "text-accent" : "text-muted hover:text-secondary"
              )}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
