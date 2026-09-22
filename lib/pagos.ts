import type { EtapaPago, PagoEmpleado } from "./types";

// Migra pagos guardados con el formato viejo `etapa` (singular) al nuevo
// `etapas` (array). Deja intactos los que ya vienen en el formato nuevo.
export function normalizePago(p: unknown): PagoEmpleado {
  const raw = (p ?? {}) as Record<string, unknown>;
  if (Array.isArray(raw.etapas)) return raw as unknown as PagoEmpleado;
  const etapa = raw.etapa as EtapaPago | undefined;
  const { etapa: _omit, ...rest } = raw;
  return { ...rest, etapas: etapa ? [etapa] : [] } as unknown as PagoEmpleado;
}
