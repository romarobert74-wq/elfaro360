"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";
import { MobileDrawer } from "./MobileDrawer";
import { useStore } from "@/components/providers/StoreProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useStore();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Esperamos a que el store restaure la sesión desde localStorage
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready && !loading && !currentUser) router.replace("/login");
  }, [ready, loading, currentUser, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-base">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setDrawer(true)} />
        <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      <BottomNav onOpenMenu={() => setDrawer(true)} />
      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} />
    </div>
  );
}
