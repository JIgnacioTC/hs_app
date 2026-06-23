import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grok-bg min-h-dvh pb-24">
      <main className="relative mx-auto max-w-lg px-4 pt-safe">{children}</main>
      <BottomNav />
    </div>
  );
}
