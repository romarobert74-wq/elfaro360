"use client";

import { useStore } from "@/components/providers/StoreProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ModuleKey } from "@/lib/types";

export function Guard({ module, children }: { module: ModuleKey; children: React.ReactNode }) {
  const { can } = useStore();
  if (!can(module, "view")) {
    return (
      <EmptyState
        icon="permisos"
        title="Sin acceso a este módulo"
        description="Tu rol no tiene permiso para ver esta sección. Contactá a un administrador si creés que es un error."
      />
    );
  }
  return <>{children}</>;
}
