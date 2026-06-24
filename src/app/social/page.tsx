"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { FriendsPanel } from "@/components/social/FriendsPanel";
import { SocialTabs, type SocialTab } from "@/components/social/SocialTabs";
import { WorkoutFeed } from "@/components/social/WorkoutFeed";

function SocialPageContent() {
  const searchParams = useSearchParams();
  const addUserId = searchParams.get("add");
  const [tab, setTab] = useState<SocialTab>(addUserId ? "friends" : "feed");

  return (
    <AppShell>
      <header className="mb-4 pt-4">
        <p className="grok-label">Comunidad</p>
        <h1 className="text-2xl font-semibold tracking-tight">Social</h1>
        <p className="mt-1 text-sm text-secondary">
          Actividad de entrenamiento y amigos
        </p>
      </header>

      <SocialTabs active={tab} onChange={setTab} />

      {tab === "feed" ? <WorkoutFeed /> : <FriendsPanel addUserId={addUserId} />}
    </AppShell>
  );
}

export default function SocialPage() {
  return (
    <Suspense fallback={null}>
      <SocialPageContent />
    </Suspense>
  );
}
