"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FriendsPanel } from "@/components/social/FriendsPanel";
import { RoutineSharesPanel } from "@/components/social/RoutineSharesPanel";
import { SocialTabs, type SocialTab } from "@/components/social/SocialTabs";
import { SocialFeed } from "@/components/social/SocialFeed";

function SocialPageContent() {
  const searchParams = useSearchParams();
  const addUserId = searchParams.get("add");
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<SocialTab>("feed");

  useEffect(() => {
    if (addUserId) {
      setTab("friends");
      return;
    }
    if (tabParam === "routines" || tabParam === "friends" || tabParam === "feed") {
      setTab(tabParam);
    }
  }, [addUserId, tabParam]);

  return (
    <>
      <header className="mb-4 pt-4">
        <p className="grok-label">Comunidad</p>
        <h1 className="text-2xl font-semibold tracking-tight">Social</h1>
        <p className="mt-1 text-sm text-secondary">
          Publicaciones, rutinas y amigos
        </p>
      </header>

      <SocialTabs active={tab} onChange={setTab} />

      {tab === "feed" && <SocialFeed />}
      {tab === "routines" && <RoutineSharesPanel />}
      {tab === "friends" && <FriendsPanel addUserId={addUserId} />}
    </>
  );
}

export default function SocialPage() {
  return (
    <Suspense fallback={null}>
      <SocialPageContent />
    </Suspense>
  );
}
