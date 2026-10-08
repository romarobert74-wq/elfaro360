import { etapaOrder } from "./labels";
import { uid } from "./format";
import type { Etapa, EtapaKey, OrdenTrabajo, Presupuesto } from "./types";

// Migración de claves de etapa viejas → nuevas. "publicacion" se descarta.
const ETAPA_MIGRACION: Record<string, EtapaKey> = { edicion: "armado_tour" };

/**
 * Normaliza una orden: migra empleadoId→empleadoIds[], migra claves de etapa
 * viejas (edicion→armado_tour, descarta publicacion) y reconstruye las etapas
 * canónicas en orden. Idempotente y seguro ante datos incompletos.
 */
export function normalizeOrden(o: OrdenTrabajo): OrdenTrabajo {
  const byKey = new Map<EtapaKey, Etapa>();
  for (const e of o.etapas ?? []) {
    const legacy = e as Etapa & { empleadoId?: string | null };
    const empleadoIds = Array.isArray(e.empleadoIds)
      ? e.empleadoIds
      : legacy.empleadoId
        ? [legacy.empleadoId]
        : [];
    const key = (ETAPA_MIGRACION[e.key as string] ?? e.key) as EtapaKey;
    if (!etapaOrder.includes(key)) continue; // descarta etapas que ya no existen (ej. publicacion)
    if (!byKey.has(key)) byKey.set(key, { ...e, key, empleadoIds });
  }
  const responsableIds = Array.isArray(o.responsableIds)
    ? o.responsableIds
    : Array.from(new Set(Array.from(byKey.values()).flatMap((e) => e.empleadoIds)));
  const etapas: Etapa[] = etapaOrder.map(
    (key) =>
      byKey.get(key) ?? {
        key,
        empleadoIds: [...responsableIds],
        fechaEstimada: null,
        fechaReal: null,
        estado: "pendiente",
        notas: "",
      }
  );
  return { ...o, responsableIds, contacto: o.contacto ?? "", servicio: o.servicio ?? "", direccion: o.direccion ?? "", fechaRelevamiento: o.fechaRelevamiento ?? null, horaRelevamiento: o.horaRelevamiento ?? "", etapas };
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
    contacto: "",
    servicio: "",
    direccion: "",
    fechaRelevamiento: null,
    horaRelevamiento: "",
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
    contacto: "",
    servicio: "",
    direccion: "",
    fechaRelevamiento: null,
    horaRelevamiento: "",
    fechaCreacion: new Date().toISOString().slice(0, 10),
    etapas: etapasVacias(responsableIds),
  };
}
