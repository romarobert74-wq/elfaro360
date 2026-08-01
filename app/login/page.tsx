"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/providers/StoreProvider";
import { roleLabels } from "@/lib/labels";
import type { Role } from "@/lib/types";

const roleTone: Record<Role, "violet" | "brand" | "green" | "gray"> = {
  super_admin: "violet",
  admin: "brand",
  empleado: "green",
  cliente: "gray",
};

export default function LoginPage() {
  const { users, currentUser, login } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) router.replace("/");
  }, [currentUser, router]);

  const handle = (id: string) => {
    login(id);
    router.replace("/");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink p-4">
      {/* Haz de luz de fondo */}
      <div className="pointer-events-none absolute inset-0 bg-brand-glow" />
      <div className="pointer-events-none absolute -left-1/4 top-1/4 h-[520px] w-[820px] -rotate-12 rounded-full bg-faro-beam opacity-[0.07] blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-3 text-sm text-content-muted">
            Virtualización de espacios en 360° · Panel de gestión
          </p>
          <div className="faro-line mt-5 w-40" />
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h1 className="font-display text-lg font-bold">Ingresar</h1>
            <p className="text-xs text-content-muted">
              Elegí un usuario para probar la experiencia según su rol (demo).
            </p>
          </div>
          <div className="divide-y divide-line">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => handle(u.id)}
                className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-surface-overlay"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient font-display text-sm font-bold text-white">
                  {u.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{u.nombre}</span>
                  <span className="block truncate text-xs text-content-subtle">{u.email}</span>
                </span>
                <Badge tone={roleTone[u.role]}>{roleLabels[u.role]}</Badge>
                <span className="text-content-subtle transition group-hover:translate-x-0.5 group-hover:text-brand">
                  <Icon name="arrowRight" size={16} />
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-content-subtle">
          Fase 1 · Datos mock en memoria — sin backend todavía
        </p>
      </div>
    </div>
  );
}
