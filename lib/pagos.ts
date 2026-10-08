import type { EtapaPago, PagoEmpleado } from "./types";

// Migración de claves de etapa viejas en pagos. "publicacion" se descarta.
const ETAPA_PAGO_MIGRACION: Record<string, EtapaPago> = { edicion: "armado_tour" };

function migraEtapas(arr: unknown): EtapaPago[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((e) => (ETAPA_PAGO_MIGRACION[e as string] ?? e) as EtapaPago)
    .filter((e) => (e as string) !== "publicacion");
}

// Migra pagos guardados con el formato viejo `etapa` (singular) al nuevo
// `etapas` (array), y migra las claves de etapa viejas.
export function normalizePago(p: unknown): PagoEmpleado {
  const raw = (p ?? {}) as Record<string, unknown>;
  if (Array.isArray(raw.etapas)) {
    return { ...raw, etapas: migraEtapas(raw.etapas) } as unknown as PagoEmpleado;
  }
  const etapa = raw.etapa as EtapaPago | undefined;
  const { etapa: _omit, ...rest } = raw;
  return { ...rest, etapas: migraEtapas(etapa ? [etapa] : []) } as unknown as PagoEmpleado;
}
