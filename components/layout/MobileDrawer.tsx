"use client";

import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { SidebarNav } from "./Sidebar";

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-r border-line bg-surface-raised shadow-2xl animate-scale-in">
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <Logo size="sm" />
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-content-muted hover:bg-surface-overlay"
            aria-label="Cerrar menú"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <SidebarNav onNavigate={onClose} />
        </div>
        <div className="border-t border-line p-3">
          <div className="faro-line" />
        </div>
      </div>
    </div>
  );
}
