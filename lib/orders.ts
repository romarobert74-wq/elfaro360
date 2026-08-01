import { etapaOrder } from "./labels";
import { uid } from "./format";
import type { Etapa, OrdenTrabajo, Presupuesto } from "./types";

/** Crea una orden de trabajo con las 5 etapas del pipeline a partir de un presupuesto aprobado. */
export function buildOrdenFromPresupuesto(p: Presupuesto, numero: string): OrdenTrabajo {
  const etapas: Etapa[] = etapaOrder.map((key) => ({
    key,
    empleadoId: null,
    fechaEstimada: null,
    fechaReal: null,
    estado: "pendiente",
    notas: "",
  }));
  return {
    id: uid("ord"),
    numero,
    presupuestoId: p.id,
    clienteId: p.clienteId,
    destinoId: p.destinoId,
    fechaCreacion: new Date().toISOString().slice(0, 10),
    etapas,
  };
}
