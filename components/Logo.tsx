import { cn } from "@/lib/cn";

/**
 * Isologo El Faro 360.
 * - Marca: faro cuyo haz se despliega en el espectro rojo→violeta.
 * - Wordmark: "EL FARO 36●" en condensada bold, con la "O" de 360 como óvalo azul.
 */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Haz de luz espectral saliendo del faro */}
      <defs>
        <linearGradient id="faroBeam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B81611" />
          <stop offset="0.2" stopColor="#C85311" />
          <stop offset="0.4" stopColor="#EACA1C" />
          <stop offset="0.6" stopColor="#267D25" />
          <stop offset="0.8" stopColor="#007FFF" />
          <stop offset="1" stopColor="#642A72" />
        </linearGradient>
      </defs>
      <g opacity="0.95">
        <path d="M24 12 L46 4 L46 20 Z" fill="url(#faroBeam)" opacity="0.85" />
        <path d="M24 12 L2 4 L2 20 Z" fill="url(#faroBeam)" opacity="0.4" />
      </g>
      {/* Cuerpo del faro */}
      <g fill="#007FFF">
        <circle cx="24" cy="11" r="3.4" fill="#EACA1C" />
        <path d="M20.5 15 h7 l1.2 4 h-9.4 z" />
        <path d="M20.8 20 h6.4 l1.6 20 h-9.6 z" />
      </g>
      <path d="M17 44 h14" stroke="#007FFF" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const markSize = size === "sm" ? 26 : size === "lg" ? 44 : 34;
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  const ovalSize = size === "sm" ? "h-3 w-2" : size === "lg" ? "h-5 w-3.5" : "h-4 w-2.5";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={markSize} />
      <span
        className={cn(
          "font-display font-bold tracking-tight leading-none flex items-center",
          textSize
        )}
      >
        <span className="text-content">EL&nbsp;FARO&nbsp;36</span>
        {/* La "O" de 360 como óvalo azul */}
        <span
          className={cn("mx-[1px] inline-block rounded-full bg-brand", ovalSize)}
          aria-label="0"
        />
      </span>
    </div>
  );
}
