"use client";

import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { CalcResult } from "@/lib/calc";

function Row({ label, value, muted, strong, accent }: { label: string; value: string; muted?: boolean; strong?: boolean; accent?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-1.5 text-sm", strong && "text-base")}>
      <span className={cn(muted ? "text-content-subtle" : "text-content-muted", strong && "font-semibold text-content")}>
        {label}
      </span>
      <span className={cn("tabular-nums", strong ? "font-bold" : "font-medium", accent && "text-brand")}>
        {value}
      </span>
    </div>
  );
}

export function ResumenCalculo({ calc }: { calc: CalcResult }) {
  return (
    <div className="card overflow-hidden">
      <div className="faro-line" />
      <div className="border-b border-line px-5 py-3">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide">Resumen de cálculo</h3>
      </div>
      <div className="px-5 py-3">
        <Row label="Mano de Obra" value={formatCurrency(calc.manoObra)} />
        <Row label="Estructura" value={formatCurrency(calc.estructura)} />
        <Row label="Traslado" value={formatCurrency(calc.traslado)} />
        <Row label="Garantía" value={formatCurrency(calc.garantia)} />
        <div className="my-1 border-t border-line" />
        <Row label="Mínimo sin Margen" value={formatCurrency(calc.minimoSinMargen)} muted />
        <Row label="Margen" value={formatCurrency(calc.margen)} />
        <Row label="Materiales Fact." value={formatCurrency(calc.materialesFact)} />
        {calc.recargoCuotas > 0 && (
          <Row label="Recargo 2 cuotas" value={formatCurrency(calc.recargoCuotas)} accent />
        )}
        <div className="my-1 border-t border-line" />
        <Row label="Subtotal" value={formatCurrency(calc.subtotal)} muted />
        <Row label="IVA" value={formatCurrency(calc.iva)} />
      </div>
      <div className="border-t border-line bg-brand/10 px-5 py-3">
        <Row label="Total General" value={formatCurrency(calc.total)} strong accent />
      </div>
    </div>
  );
}
