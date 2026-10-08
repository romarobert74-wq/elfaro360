import { uid } from "./format";
import type { Destino, Relevamiento } from "./types";

// Paso 1 — Checklist de equipamiento para salir al relevamiento.
export const EQUIPO_ITEMS: string[] = [
  "Cámara 360",
  "Cámara Osmo Pocket",
  "Trípode",
  "Memorias vacías",
  "Baterías llenas",
  "Micrófonos",
  "Dron (con carga)",
  "Tablet",
  "Celular",
  "Cables USB-C",
  "Lentes VR",
  "Estabilizadores",
  "Notebook",
  "Powerbank",
  "Control remoto",
  "Aro de luz",
  "Adaptadores de memorias",
];

// Paso 3 — Cierre "¿qué se hizo?". El tour base es lo estándar; el resto, adicionales.
export const CIERRE_ITEMS: string[] = [
  "Tour base (5 panoramas)",
  "Pack 3 panoramas",
  "Pack 5 panoramas",
  "Pack 10 panoramas",
  "Fotos planas (Osmo)",
  "Fotos planas (Insta360)",
  "Videos drone",
  "Videos reel",
  "Tour en Google Maps",
];

/** Crea un relevamiento en blanco, pre-cargando lo que se puede del destino. */
export function buildRelevamiento(destino: Destino | undefined, empleadoId: string | null = null): Relevamiento {
  return {
    id: uid("rel"),
    destinoId: destino?.id ?? "",
    presupuestoId: "",
    empleadoId,
    equipo: [],
    horario: "",
    contactoNombre: "",
    contactoCel: destino?.telefono ?? "",
    servicio: "",
    servicioAdicional: "",
    cierre: [],
    nota: "",
    estado: "borrador",
    fechaCreacion: new Date().toISOString().slice(0, 10),
    fechaCierre: null,
  };
}

/** Normaliza un relevamiento viejo/incompleto para que siempre tenga los campos. */
export function normalizeRelevamiento(r: Relevamiento): Relevamiento {
  return {
    ...r,
    equipo: Array.isArray(r.equipo) ? r.equipo : [],
    cierre: Array.isArray(r.cierre) ? r.cierre : [],
    presupuestoId: r.presupuestoId ?? "",
    horario: r.horario ?? "",
    contactoNombre: r.contactoNombre ?? "",
    contactoCel: r.contactoCel ?? "",
    servicio: r.servicio ?? "",
    servicioAdicional: r.servicioAdicional ?? "",
    nota: r.nota ?? "",
    estado: r.estado ?? "borrador",
    fechaCierre: r.fechaCierre ?? null,
  };
}
