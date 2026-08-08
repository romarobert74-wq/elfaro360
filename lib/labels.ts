import type {
  EstadoCobro,
  EstadoEtapa,
  EstadoPago,
  EstadoPresupuesto,
  EtapaKey,
  EtapaPago,
  MetodoPago,
  Role,
  TipoCosto,
} from "./types";

// Un "tono" mapea a clases utilitarias de badge (bg + text + border)
export type Tone =
  | "brand"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "navy"
  | "violet"
  | "robin"
  | "gray";

export const toneClasses: Record<Tone, string> = {
  brand: "bg-brand/15 text-brand border-brand/30",
  red: "bg-spectrum-red/15 text-spectrum-red border-spectrum-red/30",
  orange: "bg-spectrum-orange/15 text-spectrum-orange border-spectrum-orange/30",
  yellow: "bg-spectrum-yellow/15 text-spectrum-yellow border-spectrum-yellow/30",
  green: "bg-spectrum-green/15 text-spectrum-green border-spectrum-green/30",
  navy: "bg-spectrum-navy/25 text-blue-300 border-spectrum-navy/40",
  violet: "bg-spectrum-violet/20 text-spectrum-violet border-spectrum-violet/40",
  robin: "bg-robin/15 text-robin border-robin/30",
  gray: "bg-content-subtle/15 text-content-muted border-line",
};

// Color hex por tono (para charts / puntos)
export const toneHex: Record<Tone, string> = {
  brand: "#007FFF",
  red: "#B81611",
  orange: "#C85311",
  yellow: "#EACA1C",
  green: "#267D25",
  navy: "#1A2B62",
  violet: "#642A72",
  robin: "#03C2D1",
  gray: "#6E7682",
};

export const roleLabels: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  empleado: "Empleado",
  cliente: "Cliente",
};

// ===== Catálogos dinámicos =====
// Devuelve la etiqueta legible de un value dentro de un catálogo (o el value).
export function catalogLabel(list: { value: string; label: string }[] | undefined, value: string): string {
  return list?.find((x) => x.value === value)?.label ?? value;
}

// Asigna un tono estable a cualquier value (para que los tipos custom tengan color).
const tonePalette: Tone[] = ["brand", "violet", "navy", "orange", "green", "robin", "red", "yellow"];
export function toneForValue(value: string): Tone {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return tonePalette[h % tonePalette.length];
}

export const tipoCostoLabels: Record<TipoCosto, string> = {
  fijo: "Fijo",
  variable: "Variable",
};

export const metodoPagoLabels: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  cheque_30_60: "Cheque 30/60 días",
  cuotas_2: "Pago en 2 cuotas",
};

export const estadoPresupuestoLabels: Record<EstadoPresupuesto, string> = {
  borrador: "Borrador",
  enviado: "Enviado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export const estadoPresupuestoTone: Record<EstadoPresupuesto, Tone> = {
  borrador: "gray",
  enviado: "brand",
  aprobado: "green",
  rechazado: "red",
};

// Pipeline de etapas — colores tipo "espectro del faro"
export const etapaLabels: Record<EtapaKey, string> = {
  aprobado: "Aprobado",
  relevamiento: "Relevamiento",
  edicion: "Edición",
  publicacion: "Publicación",
  entregable: "Entregable",
};

export const etapaOrder: EtapaKey[] = [
  "aprobado",
  "relevamiento",
  "edicion",
  "publicacion",
  "entregable",
];

export const etapaTone: Record<EtapaKey, Tone> = {
  aprobado: "navy",
  relevamiento: "red",
  edicion: "yellow",
  publicacion: "violet",
  entregable: "green",
};

// Etapa para pagos (incluye "otros")
export function etapaPagoLabel(e: EtapaPago): string {
  return e === "otros" ? "Otros" : etapaLabels[e];
}
export function etapaPagoTone(e: EtapaPago): Tone {
  return e === "otros" ? "gray" : etapaTone[e];
}

export const estadoEtapaLabels: Record<EstadoEtapa, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  completado: "Completado",
};

export const estadoEtapaTone: Record<EstadoEtapa, Tone> = {
  pendiente: "gray",
  en_curso: "orange",
  completado: "green",
};

export const estadoPagoLabels: Record<EstadoPago, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
};

export const estadoPagoTone: Record<EstadoPago, Tone> = {
  pendiente: "orange",
  pagado: "green",
};

export const estadoCobroLabels: Record<EstadoCobro, string> = {
  pendiente: "Pendiente",
  cobrado: "Cobrado",
};

export const estadoCobroTone: Record<EstadoCobro, Tone> = {
  pendiente: "orange",
  cobrado: "green",
};
