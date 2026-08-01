"use client";

import { useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import { useStore } from "@/components/providers/StoreProvider";
import { navItems } from "@/lib/nav";
import { roleLabels } from "@/lib/labels";
import type { Role } from "@/lib/types";

const roles: Role[] = ["super_admin", "admin", "empleado"];

function Check({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition",
        checked
          ? "border-brand/40 bg-brand/15 text-brand"
          : "border-line bg-surface-base text-content-subtle",
        disabled ? "cursor-not-allowed opacity-60" : "hover:border-brand/40"
      )}
    >
      <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded-[4px] border", checked ? "border-brand bg-brand text-white" : "border-line")}>
        {checked && <Icon name="check" size={10} />}
      </span>
      {label}
    </button>
  );
}

export default function PermisosPage() {
  const { permissions, setPermission, can, currentUser } = useStore();
  const editable = can("permisos", "edit");
  const [role, setRole] = useState<Role>("admin");

  return (
    <Guard module="permisos">
      <PageHeader
        title="Configuración · Permisos"
        subtitle="Definí qué ve y qué edita cada rol. Los cambios impactan el menú en tiempo real."
      />

      {!editable && (
        <div className="mb-4 rounded-lg border border-line bg-surface-raised px-4 py-2.5 text-xs text-content-muted">
          <Icon name="permisos" size={14} className="mr-1 inline" /> Estás viendo los permisos en modo lectura. Solo un <b>Super Admin</b> puede modificarlos.
        </div>
      )}

      {/* Selector de rol (filas de la matriz) */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm font-medium transition",
              role === r ? "border-brand bg-brand/10 text-content" : "border-line bg-surface-raised text-content-muted hover:border-brand/40"
            )}
          >
            {roleLabels[r]}
            {currentUser?.role === r && <span className="ml-1.5 text-xs text-content-subtle">(tu rol)</span>}
          </button>
        ))}
      </div>

      {/* Matriz: módulos (columnas) con Ver / Editar */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-display text-sm font-bold">Permisos de {roleLabels[role]}</h2>
          {role === "super_admin" && <Badge tone="violet">Acceso total</Badge>}
        </div>
        <div className="divide-y divide-line">
          {navItems.map((item) => {
            const perm = permissions[role]?.[item.key] ?? { view: false, edit: false };
            const lockedSuper = role === "super_admin"; // super admin siempre todo
            return (
              <div key={item.key} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-overlay text-content-muted">
                    <Icon name={item.icon} size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.label}</p>
                    <p className="text-[11px] uppercase tracking-wide text-content-subtle">{item.group}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Check
                    label="Ver"
                    checked={lockedSuper ? true : perm.view}
                    disabled={!editable || lockedSuper}
                    onChange={(v) => setPermission(role, item.key, "view", v)}
                  />
                  <Check
                    label="Editar"
                    checked={lockedSuper ? true : perm.edit}
                    disabled={!editable || lockedSuper}
                    onChange={(v) => setPermission(role, item.key, "edit", v)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-xs text-content-subtle">
        <Icon name="wand" size={13} className="mr-1 inline" />
        Regla: marcar “Editar” activa “Ver” automáticamente. Desmarcar “Ver” quita “Editar”. El rol <b>Cliente</b> queda reservado para la Fase 2.
      </p>
    </Guard>
  );
}
