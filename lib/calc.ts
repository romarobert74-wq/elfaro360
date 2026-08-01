import { servicios as catalogo, settings } from "./mock-data";
import type { MetodoPago, PresupuestoConfig, PresupuestoItem } from "./types";

export interface CalcResult {
  serviciosTotal: number; // suma de items (servicios seleccionados)
  manoObra: number;
  estructura: number;
  traslado: number;
  garantia: number;
  minimoSinMargen: number;
  margen: number;
  materialesFact: number;
  recargoCuotas: number; // recargo por pago en 2 cuotas
  subtotal: number;
  iva: number;
  total: number;
}

/**
 * Motor de cálculo del presupuesto (idéntico criterio al panel de Kraken).
 *
 *  baseCostos       = mano de obra + estructura + traslado
 *  garantía         = baseCostos * garantía%
 *  mínimo sin margen= baseCostos + garantía
 *  margen           = mínimo sin margen * margen%
 *  materiales fact. = Σ servicios seleccionados + materiales extra
 *  recargo cuotas   = (solo cuotas_2) 5% sobre el plan base (tour virtual)
 *  subtotal         = mínimo sin margen + margen + materiales fact. + recargo cuotas
 *  IVA              = subtotal * IVA%
 *  total            = subtotal + IVA
 */
export function computeQuote(
  items: PresupuestoItem[],
  config: PresupuestoConfig,
  metodoPago: MetodoPago
): CalcResult {
  const serviciosTotal = items.reduce(
    (acc, it) => acc + it.cantidad * it.precioUnitario,
    0
  );

  const manoObra = config.manoObra;
  const estructura = config.estructura;
  const traslado =
    config.trasladoOverride != null ? config.trasladoOverride : config.trasladoAuto;

  const baseCostos = manoObra + estructura + traslado;
  const garantia = round(baseCostos * (config.garantiaPct / 100));
  const minimoSinMargen = baseCostos + garantia;
  const margen = round(minimoSinMargen * (config.margenPct / 100));
  const materialesFact = serviciosTotal + config.materialesFacturables;

  let recargoCuotas = 0;
  if (metodoPago === "cuotas_2") {
    // 5% sobre el plan base (tour virtual mínimo de 5 panoramas)
    const tourBase = catalogo.find((s) => s.id === "srv-1")?.precioBase ?? 0;
    const tourEnItems = items.find((it) => it.servicioId === "srv-1");
    const base = tourEnItems ? tourEnItems.precioUnitario : tourBase;
    recargoCuotas = round(base * (settings.presupuesto.recargoCuotasPct / 100));
  }

  const subtotal = minimoSinMargen + margen + materialesFact + recargoCuotas;
  const iva = round(subtotal * (config.ivaPct / 100));
  const total = subtotal + iva;

  return {
    serviciosTotal,
    manoObra,
    estructura,
    traslado,
    garantia,
    minimoSinMargen,
    margen,
    materialesFact,
    recargoCuotas,
    subtotal,
    iva,
    total,
  };
}

function round(n: number): number {
  return Math.round(n);
}
