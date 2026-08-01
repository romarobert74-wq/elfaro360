import type {
  EstadoCobro,
  EstadoEtapa,
  EstadoPago,
  EstadoPresupuesto,
  EtapaKey,
  MetodoPago,
  Puesto,
  Role,
  TipoCliente,
  TipoCosto,
  TipoServicio,
  Vertical,
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

export const tipoClienteLabels: Record<TipoCliente, string> = {
  inmobiliaria: "Inmobiliaria",
  destino_turistico: "Destino turístico",
  otros: "Otros",
};

export const tipoClienteTone: Record<TipoCliente, Tone> = {
  inmobiliaria: "navy",
  destino_turistico: "robin",
  otros: "gray",
};

export const verticalLabels: Record<Vertical, string> = {
  real_estate: "Real Estate",
  bodega: "Bodega",
  hotel: "Hotel",
  restaurante: "Restaurante",
  otro: "Otro",
};

export const verticalTone: Record<Vertical, Tone> = {
  real_estate: "brand",
  bodega: "violet",
  hotel: "navy",
  restaurante: "orange",
  otro: "gray",
};

export const tipoServicioLabels: Record<TipoServicio, string> = {
  tour_virtual: "Tour virtual",
  video_reel: "Video / Reel",
  pack_fotos: "Pack fotos",
  dron: "Dron",
  adicional: "Adicional",
};

export const tipoServicioTone: Record<TipoServicio, Tone> = {
  tour_virtual: "brand",
  video_reel: "violet",
  pack_fotos: "green",
  dron: "orange",
  adicional: "gray",
};

export const tipoCostoLabels: Record<TipoCosto, string> = {
  fijo: "Fijo",
  variable: "Variable",
};

export const puestoLabels: Record<Puesto, string> = {
  editor_fotos: "Editor de fotos",
  editor_video: "Editor de video",
  relevador: "Relevador",
  administrativo: "Administrativo",
  dron: "Piloto de dron",
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
