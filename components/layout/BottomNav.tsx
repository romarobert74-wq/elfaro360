"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import { navItems } from "@/lib/nav";
import { useStore } from "@/components/providers/StoreProvider";
import { useSeleccionesNoLeidas } from "@/components/pictures/useSeleccionesBadge";
import type { ModuleKey } from "@/lib/types";

const preferred: ModuleKey[] = ["dashboard", "presupuestos", "ordenes", "agenda", "clientes"];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const { can, currentUser } = useStore();
  const noLeidas = useSeleccionesNoLeidas();
  // El empleado nunca ve el Dashboard (ni aunque la matriz guardada lo permita)
  const oculto = (k: string) => currentUser?.role === "empleado" && k === "dashboard";

  const quick = preferred
    .map((k) => navItems.find((n) => n.key === k))
    .filter((n): n is NonNullable<typeof n> => !!n && can(n.key, "view") && !oculto(n.key))
    .slice(0, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-line bg-surface-raised/95 backdrop-blur-md lg:hidden">
      {quick.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition",
              active ? "text-brand" : "text-content-subtle"
            )}
          >
            <Icon name={item.icon} size={20} />
            <span className="max-w-full truncate px-1">{item.label.split(" ")[0]}</span>
          </Link>
        );
      })}
      <button
        onClick={onOpenMenu}
        className="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-content-subtle"
      >
        <span className="relative">
          <Icon name="menu" size={20} />
          {noLeidas > 0 && (
            <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
              {noLeidas}
            </span>
          )}
        </span>
        <span>Más</span>
      </button>
    </nav>
  );
}
