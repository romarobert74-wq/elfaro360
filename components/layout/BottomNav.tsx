"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import { navItems } from "@/lib/nav";
import { useStore } from "@/components/providers/StoreProvider";
import type { ModuleKey } from "@/lib/types";

const preferred: ModuleKey[] = ["dashboard", "presupuestos", "ordenes", "agenda", "clientes"];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const { can } = useStore();

  const quick = preferred
    .map((k) => navItems.find((n) => n.key === k))
    .filter((n): n is NonNullable<typeof n> => !!n && can(n.key, "view"))
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
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-content-subtle"
      >
        <Icon name="menu" size={20} />
        <span>Más</span>
      </button>
    </nav>
  );
}
