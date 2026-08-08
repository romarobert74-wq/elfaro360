"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/Badge";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useStore } from "@/components/providers/StoreProvider";
import { roleLabels } from "@/lib/labels";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/cn";

const roles: Role[] = ["super_admin", "admin", "empleado"];

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { theme, toggle } = useTheme();
  const { currentUser, setRole, logout, backend } = useStore();
  const showRoleSwitcher = backend === "mock";
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  if (!currentUser) return null;

  const initials = currentUser.nombre
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface-base/80 px-4 backdrop-blur-md lg:px-6">
      {/* Mobile: hamburger + logo */}
      <button
        onClick={onOpenMenu}
        className="rounded-lg p-2 text-content-muted hover:bg-surface-overlay lg:hidden"
        aria-label="Abrir menú"
      >
        <Icon name="menu" size={20} />
      </button>
      <div className="lg:hidden">
        <Logo size="sm" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Switcher de rol (solo demo/mock) */}
        <div className={`${showRoleSwitcher ? "hidden sm:flex" : "hidden"} items-center gap-1.5 rounded-lg border border-line bg-surface-raised px-2 py-1.5`}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-content-subtle">
            Rol demo
          </span>
          <select
            value={currentUser.role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="cursor-pointer bg-transparent text-xs font-medium text-content outline-none"
          >
            {roles.map((r) => (
              <option key={r} value={r} className="bg-surface-overlay text-content">
                {roleLabels[r]}
              </option>
            ))}
          </select>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="rounded-lg border border-line bg-surface-raised p-2 text-content-muted transition hover:text-content"
          aria-label="Cambiar tema"
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface-raised py-1 pl-1 pr-2 transition hover:border-brand/40"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-gradient text-xs font-bold text-white">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-medium leading-tight">{currentUser.nombre}</span>
              <span className="block text-[10px] leading-tight text-content-subtle">
                {roleLabels[currentUser.role]}
              </span>
            </span>
            <Icon name="chevronDown" size={14} className="text-content-subtle" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface-overlay shadow-2xl animate-scale-in">
                <div className="border-b border-line px-4 py-3">
                  <p className="text-sm font-medium">{currentUser.nombre}</p>
                  <p className="truncate text-xs text-content-subtle">{currentUser.email}</p>
                  <Badge tone="brand" className="mt-2">
                    {roleLabels[currentUser.role]}
                  </Badge>
                </div>
                <div className={`p-1.5 ${showRoleSwitcher ? "sm:hidden" : "hidden"}`}>
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-content-subtle">
                    Rol demo
                  </p>
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRole(r);
                        setMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm",
                        currentUser.role === r ? "text-brand" : "text-content-muted hover:bg-surface-base"
                      )}
                    >
                      {roleLabels[r]}
                      {currentUser.role === r && <Icon name="check" size={14} />}
                    </button>
                  ))}
                </div>
                <div className="border-t border-line p-1.5">
                  <button
                    onClick={() => {
                      logout();
                      router.replace("/login");
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-content-muted transition hover:bg-spectrum-red/10 hover:text-spectrum-red"
                  >
                    <Icon name="logout" size={16} />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
