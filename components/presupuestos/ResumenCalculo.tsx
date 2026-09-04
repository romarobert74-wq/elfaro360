"use client";

import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { CalcResult } from "@/lib/calc";

function Row({ label, value, muted, strong, accent, tone }: { label: string; value: string; muted?: boolean; strong?: boolean; accent?: boolean; tone?: "green" | "red" }) {
  return (
    <div className={cn("flex items-center justify-between py-1.5 text-sm", strong && "text-base")}>
      <span className={cn(muted ? "text-content-subtle" : "text-content-muted", strong && "font-semibold text-content")}>
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          strong ? "font-bold" : "font-medium",
          accent && "text-brand",
          tone === "green" && "text-spectrum-green",
          tone === "red" && "text-spectrum-red"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function ResumenCalculo({ calc }: { calc: CalcResult }) {
  const gananciaOk = calc.ganancia >= 0;
  return (
    <div className="card overflow-hidden">
      <div className="faro-line" />
      {/* Cliente */}
      <div className="border-b border-line px-5 py-3">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide">Lo que paga el cliente</h3>
      </div>
      <div className="px-5 py-3">
        <Row label="Servicios" value={formatCurrency(calc.materialesFact)} />
        {calc.traslado > 0 && <Row label="Traslado (zona)" value={formatCurrency(calc.traslado)} />}
        {calc.recargoCuotas > 0 && <Row label="Recargo 2 cuotas" value={formatCurrency(calc.recargoCuotas)} accent />}
        {calc.descuento > 0 && <Row label="Descuento" value={`- ${formatCurrency(calc.descuento)}`} tone="red" />}
        <div className="my-1 border-t border-line" />
        <Row label="Subtotal" value={formatCurrency(calc.subtotal)} muted />
        <Row label="IVA" value={formatCurrency(calc.iva)} />
      </div>
      <div className="border-t border-line bg-brand/10 px-5 py-3">
        <Row label="Total General" value={formatCurrency(calc.total)} strong accent />
      </div>

      {/* Rentabilidad interna */}
      <div className="border-t border-line px-5 py-3">
        <h3 className="mb-1 font-display text-xs font-bold uppercase tracking-wide text-content-subtle">
          Rentabilidad (interno)
        </h3>
        <Row label="Mano de obra (costo)" value={formatCurrency(calc.manoObra)} muted />
        <Row label="Estructura" value={formatCurrency(calc.estructura)} muted />
        <Row label="Garantía" value={formatCurrency(calc.garantia)} muted />
        <Row label="Costo interno" value={formatCurrency(calc.costoInterno)} muted />
        <div className="my-1 border-t border-line" />
        <Row
          label={`Ganancia estimada (${calc.gananciaPct.toFixed(0)}%)`}
          value={formatCurrency(calc.ganancia)}
          strong
          tone={gananciaOk ? "green" : "red"}
        />
      </div>
    </div>
  );
}
