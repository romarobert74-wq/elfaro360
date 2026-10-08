import { etapaOrder } from "./labels";
import { uid } from "./format";
import type { Etapa, OrdenTrabajo, Presupuesto } from "./types";

/**
 * Migra órdenes con formato viejo (etapa.empleadoId único) al nuevo
 * (etapa.empleadoIds[]). Idempotente y seguro ante datos incompletos.
 */
export function normalizeOrden(o: OrdenTrabajo): OrdenTrabajo {
  const etapas = (o.etapas ?? []).map((e) => {
    const legacy = e as Etapa & { empleadoId?: string | null };
    const empleadoIds = Array.isArray(e.empleadoIds)
      ? e.empleadoIds
      : legacy.empleadoId
        ? [legacy.empleadoId]
        : [];
    return { ...e, empleadoIds };
  });
  // responsableIds nuevo: si falta (datos viejos), se deriva de los responsables de las etapas.
  const responsableIds = Array.isArray(o.responsableIds)
    ? o.responsableIds
    : Array.from(new Set(etapas.flatMap((e) => e.empleadoIds)));
  return { ...o, responsableIds, etapas };
}

function etapasVacias(responsableIds: string[] = []): Etapa[] {
  return etapaOrder.map((key) => ({
    key,
    empleadoIds: [...responsableIds],
    fechaEstimada: null,
    fechaReal: null,
    estado: "pendiente",
    notas: "",
  }));
}

/** Crea una orden de trabajo con las 5 etapas del pipeline a partir de un presupuesto aprobado. */
export function buildOrdenFromPresupuesto(p: Presupuesto, numero: string, responsableIds: string[] = []): OrdenTrabajo {
  return {
    id: uid("ord"),
    numero,
    presupuestoId: p.id,
    clienteId: p.clienteId,
    destinoId: p.destinoId,
    responsableIds,
    fechaCreacion: new Date().toISOString().slice(0, 10),
    etapas: etapasVacias(responsableIds),
  };
}

/** Crea una orden en blanco (sin presupuesto), eligiendo cliente, destino y responsable(s). */
export function buildOrdenBlank(clienteId: string, destinoId: string, numero: string, responsableIds: string[] = []): OrdenTrabajo {
  return {
    id: uid("ord"),
    numero,
    presupuestoId: "",
    clienteId,
    destinoId,
    responsableIds,
    fechaCreacion: new Date().toISOString().slice(0, 10),
    etapas: etapasVacias(responsableIds),
  };
}
