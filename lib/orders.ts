import { etapaOrder } from "./labels";
import { uid } from "./format";
import type { Etapa, OrdenTrabajo, Presupuesto } from "./types";

function etapasVacias(): Etapa[] {
  return etapaOrder.map((key) => ({
    key,
    empleadoId: null,
    fechaEstimada: null,
    fechaReal: null,
    estado: "pendiente",
    notas: "",
  }));
}

/** Crea una orden de trabajo con las 5 etapas del pipeline a partir de un presupuesto aprobado. */
export function buildOrdenFromPresupuesto(p: Presupuesto, numero: string): OrdenTrabajo {
  return {
    id: uid("ord"),
    numero,
    presupuestoId: p.id,
    clienteId: p.clienteId,
    destinoId: p.destinoId,
    fechaCreacion: new Date().toISOString().slice(0, 10),
    etapas: etapasVacias(),
  };
}

/** Crea una orden en blanco (sin presupuesto), eligiendo cliente y destino. */
export function buildOrdenBlank(clienteId: string, destinoId: string, numero: string): OrdenTrabajo {
  return {
    id: uid("ord"),
    numero,
    presupuestoId: "",
    clienteId,
    destinoId,
    fechaCreacion: new Date().toISOString().slice(0, 10),
    etapas: etapasVacias(),
  };
}
