"use client";

import { cn } from "@/lib/cn";

/**
 * Cartel visual del entorno/rama en el que corre la app.
 * - production (main) → verde discreto
 * - preview / develop / otra rama → naranja llamativo (¡ojo, no es producción!)
 * - local → gris
 */
export function EnvBadge() {
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV || "development";
  const branch = process.env.NEXT_PUBLIC_GIT_BRANCH || "local";

  const isProd = env === "production";
  const isLocal = env === "development";

  const label = isProd ? "PRODUCCIÓN" : isLocal ? "LOCAL" : "DESARROLLO";
  const tone = isProd
    ? "border-spectrum-green/40 bg-spectrum-green/15 text-spectrum-green"
    : isLocal
    ? "border-line bg-surface-overlay text-content-muted"
    : "border-spectrum-orange/50 bg-spectrum-orange/15 text-spectrum-orange";

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wide", tone)}
      title={`Entorno: ${env} · Rama: ${branch}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
      <span className="font-medium normal-case opacity-70">· {branch}</span>
    </span>
  );
}
