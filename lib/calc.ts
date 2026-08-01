import { appSettings } from "./mock-data";
import type { AppSettings, MetodoPago, PresupuestoConfig, PresupuestoItem, ZonaTraslado } from "./types";

export interface CalcResult {
  // ---- Lo que ve/paga el cliente ----
  serviciosTotal: number; // suma de precios finales de los servicios
  traslado: number; // costo de la zona (o override)
  recargoCuotas: number;
  materialesFact: number; // serviciosTotal + extras
  subtotal: number;
  iva: number;
  total: number; // TOTAL que paga el cliente
  // ---- Análisis interno (rentabilidad) ----
  manoObra: number; // costo de los servicios (lo que pago a los chicos)
  estructura: number;
  garantia: number;
  costoInterno: number; // manoObra + estructura + garantía
  ganancia: number; // subtotal - costoInterno
  gananciaPct: number;
}

/** Devuelve la zona de traslado que corresponde a una distancia en km. */
export function zonaParaKm(km: number, zonas: ZonaTraslado[]): ZonaTraslado | null {
  const orden = [...zonas].sort((a, b) => (a.kmHasta ?? Infinity) - (b.kmHasta ?? Infinity));
  for (const z of orden) {
    if (z.kmHasta == null || km <= z.kmHasta) return z;
  }
  return orden[orden.length - 1] ?? null;
}

/**
 * Motor de cálculo del presupuesto.
 *
 * CLIENTE (lo que ve en el PDF):
 *   servicios (precio final) + traslado (zona) [+ recargo cuotas] = subtotal
 *   IVA (si está activado) → total
 *
 * INTERNO (tu rentabilidad, panel lateral):
 *   mano de obra (suma de COSTOS de los servicios, auto o manual)
 *   + estructura (prorrateo de costos fijos)
 *   + garantía (% de reserva)  = costo interno
 *   ganancia = subtotal (sin IVA) − costo interno
 */
export function computeQuote(
  items: PresupuestoItem[],
  config: PresupuestoConfig,
  metodoPago: MetodoPago,
  settings: AppSettings = appSettings
): CalcResult {
  const serviciosTotal = items.reduce((a, it) => a + it.cantidad * it.precioUnitario, 0);
  const costoServicios = items.reduce((a, it) => a + it.cantidad * (it.costoUnitario ?? 0), 0);

  // Mano de obra automática (= costo de los servicios) con opción de override manual
  const manoObra = config.manoObraOverride != null ? config.manoObraOverride : costoServicios;
  const estructura = config.estructura;
  const traslado = config.trasladoOverride != null ? config.trasladoOverride : config.trasladoAuto;

  // Recargo por pago en 2 cuotas (5% sobre el plan base / tour virtual)
  let recargoCuotas = 0;
  if (metodoPago === "cuotas_2") {
    const tour = items.find((it) => it.servicioId === "srv-1");
    const base = tour ? tour.precioUnitario : 0;
    recargoCuotas = round(base * (settings.recargoCuotasPct / 100));
  }

  const materialesFact = serviciosTotal + config.materialesFacturables;
  const subtotal = materialesFact + traslado + recargoCuotas;
  const iva = config.conIva ? round(subtotal * (config.ivaPct / 100)) : 0;
  const total = subtotal + iva;

  // Análisis interno
  const garantia = round((manoObra + estructura) * (config.garantiaPct / 100));
  const costoInterno = manoObra + estructura + garantia;
  const ganancia = subtotal - costoInterno;
  const gananciaPct = subtotal > 0 ? (ganancia / subtotal) * 100 : 0;

  return {
    serviciosTotal,
    traslado,
    recargoCuotas,
    materialesFact,
    subtotal,
    iva,
    total,
    manoObra,
    estructura,
    garantia,
    costoInterno,
    ganancia,
    gananciaPct,
  };
}

function round(n: number): number {
  return Math.round(n);
}
