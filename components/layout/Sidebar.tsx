"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import { navGroups, navItems } from "@/lib/nav";
import { useStore } from "@/components/providers/StoreProvider";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { can } = useStore();

  const visible = navItems.filter((n) => can(n.key, "view"));

  return (
    <nav className="flex flex-col gap-5 px-3 py-2">
      {navGroups.map((group) => {
        const items = visible.filter((n) => n.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-content-subtle">
              {group}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                        active
                          ? "bg-brand/12 text-brand"
                          : "text-content-muted hover:bg-surface-overlay hover:text-content"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand shadow-glow-sm" />
                      )}
                      <Icon name={item.icon} size={18} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-surface-raised lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-line px-5">
        <Logo size="md" />
      </div>
      <div className="flex-1 overflow-y-auto py-3">
        <SidebarNav />
      </div>
      <div className="border-t border-line p-3">
        <div className="faro-line mb-3" />
        <p className="px-2 text-[10px] text-content-subtle">
          El Faro 360 · v0.1 — Fase 1 (mock)
        </p>
      </div>
    </aside>
  );
}
