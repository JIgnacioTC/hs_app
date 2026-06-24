import { AppBootstrap } from "@/components/AppBootstrap";
import { AppShell } from "@/components/AppShell";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppBootstrap>
      <AppShell>{children}</AppShell>
    </AppBootstrap>
  );
}
