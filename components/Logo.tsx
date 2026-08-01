import { cn } from "@/lib/cn";

/**
 * Isologo El Faro 360.
 * Wordmark en tipografía condensada bold; la "O" de 360 es un óvalo azul
 * con contorno (hueco). El texto usa `currentColor` para adaptarse al fondo:
 * blanco sobre superficies oscuras (menú), negro en el PDF (fondo claro).
 */

// El óvalo azul con contorno — el elemento distintivo de la marca.
// Se dimensiona en `em`, así siempre acompaña el tamaño del texto de al lado.
function OvalO({ className }: { className?: string }) {
  return (
    <span
      aria-label="0"
      role="img"
      className={cn("inline-block shrink-0 rounded-full border-brand align-middle", className)}
      style={{ width: "0.92em", height: "0.7em", borderWidth: "0.17em" }}
    />
  );
}

const horizontalSize: Record<string, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
};

const stackedSize: Record<string, string> = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-6xl",
};

export function Logo({
  variant = "horizontal",
  size = "md",
  className,
}: {
  variant?: "horizontal" | "stacked";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (variant === "stacked") {
    return (
      <div
        className={cn(
          "select-none font-display font-bold uppercase leading-[0.82] tracking-[-0.03em]",
          stackedSize[size],
          className
        )}
      >
        <div>EL</div>
        <div>FARO</div>
        <div className="flex items-center">
          <span>36</span>
          <OvalO className="ml-[0.05em]" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex select-none items-center font-display font-bold uppercase tracking-tight",
        horizontalSize[size],
        className
      )}
    >
      <span>EL&nbsp;FARO&nbsp;36</span>
      <OvalO className="ml-[0.06em]" />
    </div>
  );
}

/** Marca mínima (solo el óvalo azul) para usos chicos / favicon. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label="El Faro 360"
      className={cn("inline-block rounded-full border-brand", className)}
      style={{ width: size, height: size * 0.76, borderWidth: Math.max(2, size * 0.17) }}
    />
  );
}
