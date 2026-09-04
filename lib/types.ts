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
  | "configuracion"
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
// Los tipos son dinámicos (se administran en Configuración). Guardamos el "value".
export type TipoCliente = string;

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
  telefono: string; // WhatsApp / teléfono (unificado)
  redes: RedesSociales;
  web: string;
  notas: string;
}

// ===== Destinos =====
export type Vertical = string; // dinámico (Configuración)

// Campo flexible: el usuario agrega lo que quiera (m² cubiertos, terreno, etc.)
export interface DestinoCampo {
  id: string;
  label: string;
  value: string;
}

export interface Destino {
  id: string;
  clienteId: string;
  nombre: string;
  direccion: string;
  distanciaKm: number;
  telefono: string; // WhatsApp / teléfono (unificado)
  redes: RedesSociales;
  web: string;
  vertical: Vertical;
  campos: DestinoCampo[]; // datos flexibles
}

// ===== Servicios (catálogo) =====
export type TipoServicio = string; // dinámico (Configuración)

export interface Servicio {
  id: string;
  tipo: TipoServicio;
  nombre: string;
  unidad: string; // unidad de medida
  costo: number; // lo que me cuesta / pago a los chicos por hacerlo
  precioBase: number; // precio final que ve el cliente
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
  precioUnitario: number; // precio final al cliente
  costoUnitario: number; // costo interno (lo que pago a los chicos)
  autoAgregado?: boolean; // ej. pack por cheque
}

export interface PresupuestoConfig {
  manoObra: number; // auto = suma de costos internos de los servicios (editable)
  manoObraOverride: number | null; // si se edita a mano
  estructura: number;
  trasladoAuto: number; // costo de la zona según distancia
  trasladoOverride: number | null;
  garantiaPct: number;
  margenPct: number;
  ivaPct: number;
  conIva: boolean; // switch con/sin IVA
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
  | "aprobado"
  | "relevamiento"
  | "edicion"
  | "publicacion"
  | "entregable";

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
export type Puesto = string; // dinámico (Configuración)

export interface Empleado {
  id: string;
  nombre: string;
  puesto: Puesto;
  telefono: string;
  email: string;
}

// ===== Pagos a empleados =====
export type EstadoPago = "pendiente" | "pagado";

export type EtapaPago = EtapaKey | "otros";

export interface PagoEmpleado {
  id: string;
  empleadoId: string;
  ordenId: string; // orden asociada (su presupuesto se muestra como referencia)
  etapa: EtapaPago;
  monto: number;
  estado: EstadoPago;
  fecha: string | null; // fecha de pago
}

// ===== Configuración (settings editables) =====
export interface ZonaTraslado {
  id: string;
  nombre: string;
  kmHasta: number | null; // límite superior en km; null = "en adelante"
  costo: number | null; // null = "a consultar" (se carga manual en el presupuesto)
}

export interface CatalogoItem {
  value: string;
  label: string;
}
export interface CatalogoTipoCliente extends CatalogoItem {
  permiteCuotas: boolean; // habilita "pago en 2 cuotas" en el presupuesto
}

export interface AppSettings {
  empresa: {
    nombre: string;
    cuit: string;
    email: string;
    telefono: string;
    aliasMercadoPago: string;
    contactoNombre: string;
    contactoCel: string;
  };
  // Catálogos dinámicos (se editan en Configuración)
  catalogos: {
    tiposCliente: CatalogoTipoCliente[];
    verticales: CatalogoItem[];
    tiposServicio: CatalogoItem[];
    puestos: CatalogoItem[];
  };
  // Finanzas / cálculo
  dolarHoy: number; // valor del dólar del día (referencia)
  diasLaborales: number; // días laborales al mes (para prorratear estructura)
  tarifaKmEmpleado: number; // $/km que se paga a los chicos por traslado a relevamiento
  garantiaPctDefault: number;
  margenPctDefault: number;
  ivaPctDefault: number;
  conIvaDefault: boolean;
  // Intereses por forma de pago
  recargoChequePackId: string; // pack que se agrega al pagar con cheque
  recargoCuotasPct: number; // interés por pago en 2 cuotas
  // Numeración
  numeroInicialPresupuesto: number;
  // Zonas de traslado (lo que se le cobra al cliente por desplazamiento)
  zonas: ZonaTraslado[];
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
