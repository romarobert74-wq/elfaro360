// ===== Roles & permisos =====
// 'cliente' se deja declarado para Fase 2 (no se usa aún en la UI activa).
export type Role = "super_admin" | "admin" | "empleado" | "cliente";

export type ModuleKey =
  | "dashboard"
  | "clientes"
  | "destinos"
  | "servicios"
  | "presupuestos"
  | "costos"
  | "ordenes"
  | "agenda"
  | "empleados"
  | "pagos"
  | "cobros"
  | "reportes"
  | "usuarios"
  | "permisos";

export interface Permission {
  view: boolean;
  edit: boolean;
}

// role -> module -> Permission
export type PermissionMatrix = Record<Role, Partial<Record<ModuleKey, Permission>>>;

export interface User {
  id: string;
  nombre: string;
  email: string;
  role: Role;
  empleadoId?: string; // vincula el usuario con su ficha de empleado
  activo: boolean;
}

// ===== Clientes =====
export type TipoCliente = "inmobiliaria" | "destino_turistico" | "otros";

export interface RedesSociales {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  razonSocial: string;
  tipoCliente: TipoCliente;
  telefono: string;
  whatsapp: string;
  redes: RedesSociales;
  web: string;
  notas: string;
}

// ===== Destinos =====
export type Vertical = "real_estate" | "bodega" | "hotel" | "restaurante" | "otro";

export interface Destino {
  id: string;
  clienteId: string;
  nombre: string;
  direccion: string;
  distanciaKm: number;
  telefono: string;
  whatsapp: string;
  redes: RedesSociales;
  web: string;
  vertical: Vertical;
  // Datos específicos flexibles según vertical
  datos: {
    m2?: number; // real_estate
    habitaciones?: number; // hotel
    hectareas?: number; // bodega
    mesas?: number; // restaurante
    extra?: string;
  };
}

// ===== Servicios (catálogo) =====
export type TipoServicio =
  | "tour_virtual"
  | "video_reel"
  | "pack_fotos"
  | "dron"
  | "adicional";

export interface Servicio {
  id: string;
  tipo: TipoServicio;
  nombre: string;
  unidad: string; // unidad de medida
  precioBase: number;
}

// ===== Costos (fijos / variables de la empresa) =====
export type TipoCosto = "fijo" | "variable";
export type FrecuenciaCosto = "mensual" | "anual" | "por_trabajo" | "unico";

export interface Costo {
  id: string;
  nombre: string;
  tipo: TipoCosto;
  precio: number;
  cantidad: number;
  frecuencia: FrecuenciaCosto;
}

// ===== Presupuestos =====
export type MetodoPago =
  | "efectivo"
  | "transferencia"
  | "cheque_30_60"
  | "cuotas_2";

export type EstadoPresupuesto =
  | "borrador"
  | "enviado"
  | "aprobado"
  | "rechazado";

export interface PresupuestoItem {
  servicioId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  autoAgregado?: boolean; // ej. pack por cheque
}

export interface PresupuestoConfig {
  manoObra: number;
  estructura: number;
  trasladoAuto: number; // distancia_km * tarifaKm
  trasladoOverride: number | null;
  garantiaPct: number;
  margenPct: number;
  ivaPct: number;
  materialesFacturables: number;
}

export interface Presupuesto {
  id: string;
  numero: string;
  clienteId: string;
  destinoId: string;
  fecha: string; // ISO
  items: PresupuestoItem[];
  metodoPago: MetodoPago;
  config: PresupuestoConfig;
  estado: EstadoPresupuesto;
  notas: string;
}

// ===== Órdenes de trabajo =====
export type EtapaKey =
  | "agendado"
  | "filmacion"
  | "edicion"
  | "publicacion"
  | "entregado";

export type EstadoEtapa = "pendiente" | "en_curso" | "completado";

export interface Etapa {
  key: EtapaKey;
  empleadoId: string | null;
  fechaEstimada: string | null;
  fechaReal: string | null;
  estado: EstadoEtapa;
  notas: string;
}

export interface OrdenTrabajo {
  id: string;
  numero: string;
  presupuestoId: string;
  clienteId: string;
  destinoId: string;
  etapas: Etapa[];
  fechaCreacion: string;
}

// ===== Empleados =====
export type Puesto =
  | "editor_fotos"
  | "editor_video"
  | "relevador"
  | "administrativo"
  | "dron";

export interface Empleado {
  id: string;
  nombre: string;
  puesto: Puesto;
  telefono: string;
  email: string;
  tarifaDefault: number;
}

// ===== Pagos a empleados =====
export type EstadoPago = "pendiente" | "pagado";

export interface PagoEmpleado {
  id: string;
  empleadoId: string;
  ordenId: string;
  etapa: EtapaKey;
  monto: number;
  estado: EstadoPago;
  fecha: string | null; // fecha de pago
}

// ===== Cobros =====
export type EstadoCobro = "pendiente" | "cobrado";

export interface Cobro {
  id: string;
  presupuestoId: string;
  clienteId: string;
  metodo: MetodoPago;
  importe: number;
  estado: EstadoCobro;
  fecha: string | null;
}
