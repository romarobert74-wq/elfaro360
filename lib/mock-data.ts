import type {
  AgendaNota,
  AppSettings,
  Cliente,
  Cobro,
  Costo,
  Destino,
  Empleado,
  OrdenTrabajo,
  PagoEmpleado,
  PermissionMatrix,
  Presupuesto,
  Servicio,
  User,
} from "./types";

// ============================================================
//  EL FARO 360 — DATOS MOCK EN MEMORIA (Fase 1)
//  Todo esto vive en arrays hardcodeados. En Fase 2 se
//  reemplaza por Firebase sin tocar la UI.
// ============================================================

// ---------- Configuración global (editable desde /configuracion) ----------
export const appSettings: AppSettings = {
  empresa: {
    nombre: "El Faro 360",
    cuit: "30-71727272-3",
    email: "admelfaro360@gmail.com",
    telefono: "+54 9 261 665 7058",
    aliasMercadoPago: "elfaro360",
    contactoNombre: "Roberto Martinez",
    contactoCel: "2616657058",
  },
  catalogos: {
    tiposCliente: [
      { value: "inmobiliaria", label: "Inmobiliaria", permiteCuotas: false },
      { value: "destino_turistico", label: "Destino turístico", permiteCuotas: true },
      { value: "otros", label: "Otros", permiteCuotas: false },
    ],
    verticales: [
      { value: "real_estate", label: "Real Estate" },
      { value: "bodega", label: "Bodega" },
      { value: "hotel", label: "Hotel" },
      { value: "restaurante", label: "Restaurante" },
      { value: "otro", label: "Otro" },
    ],
    tiposServicio: [
      { value: "tour_virtual", label: "Tour virtual" },
      { value: "video_reel", label: "Video / Reel" },
      { value: "pack_fotos", label: "Pack fotos" },
      { value: "dron", label: "Dron" },
      { value: "adicional", label: "Adicional" },
    ],
    puestos: [
      { value: "relevador", label: "Relevador" },
      { value: "editor_fotos", label: "Editor de fotos" },
      { value: "editor_video", label: "Editor de video" },
      { value: "dron", label: "Piloto de dron" },
      { value: "administrativo", label: "Administrativo" },
    ],
  },
  dolarHoy: 1350,
  diasLaborales: 22,
  tarifaKmEmpleado: 900, // $/km que se paga a los chicos por ir al relevamiento
  garantiaPctDefault: 5,
  margenPctDefault: 35,
  ivaPctDefault: 21,
  conIvaDefault: true,
  recargoChequePackId: "srv-2", // Pack x3 panoramas que se agrega al elegir cheque
  recargoCuotasPct: 5,
  numeroInicialPresupuesto: 1,
  zonas: [
    { id: "z1", nombre: "Zona 1 (hasta 20 km)", kmHasta: 20, costo: 30000 },
    { id: "z2", nombre: "Zona 2 (20 a 40 km)", kmHasta: 40, costo: 55000 },
    { id: "z3", nombre: "Zona 3 (más de 40 km)", kmHasta: null, costo: null }, // a consultar
  ],
};

// ---------- Usuarios del sistema ----------
export const users: User[] = [
  {
    id: "usr-1",
    nombre: "Roma Robert",
    email: "roma@elfaro360.com",
    role: "super_admin",
    activo: true,
  },
  {
    id: "usr-2",
    nombre: "Lucía Admin",
    email: "lucia@elfaro360.com",
    role: "admin",
    activo: true,
  },
  {
    id: "usr-3",
    nombre: "Diego Relevador",
    email: "diego@elfaro360.com",
    role: "empleado",
    empleadoId: "emp-1",
    activo: true,
  },
  {
    id: "usr-4",
    nombre: "Sofi Editora",
    email: "sofi@elfaro360.com",
    role: "empleado",
    empleadoId: "emp-2",
    activo: true,
  },
];

// ---------- Matriz de permisos (rol -> módulo -> {view, edit}) ----------
// Default: admin ve todo. Empleado ve solo Agenda, Órdenes y Mis Pagos.
export const permissionMatrix: PermissionMatrix = {
  super_admin: {
    dashboard: { view: true, edit: true },
    clientes: { view: true, edit: true },
    destinos: { view: true, edit: true },
    servicios: { view: true, edit: true },
    presupuestos: { view: true, edit: true },
    costos: { view: true, edit: true },
    ordenes: { view: true, edit: true },
    agenda: { view: true, edit: true },
    empleados: { view: true, edit: true },
    pagos: { view: true, edit: true },
    cobros: { view: true, edit: true },
    reportes: { view: true, edit: true },
    configuracion: { view: true, edit: true },
    usuarios: { view: true, edit: true },
    permisos: { view: true, edit: true },
  },
  admin: {
    dashboard: { view: true, edit: true },
    clientes: { view: true, edit: true },
    destinos: { view: true, edit: true },
    servicios: { view: true, edit: true },
    presupuestos: { view: true, edit: true },
    costos: { view: true, edit: true },
    ordenes: { view: true, edit: true },
    agenda: { view: true, edit: true },
    empleados: { view: true, edit: true },
    pagos: { view: true, edit: true },
    cobros: { view: true, edit: true },
    reportes: { view: true, edit: true },
    configuracion: { view: true, edit: true },
    usuarios: { view: true, edit: false },
    permisos: { view: true, edit: false },
  },
  empleado: {
    dashboard: { view: true, edit: false },
    clientes: { view: false, edit: false },
    destinos: { view: false, edit: false },
    servicios: { view: false, edit: false },
    presupuestos: { view: false, edit: false },
    costos: { view: false, edit: false },
    ordenes: { view: true, edit: false },
    agenda: { view: true, edit: false },
    empleados: { view: false, edit: false },
    pagos: { view: true, edit: false },
    cobros: { view: false, edit: false },
    reportes: { view: false, edit: false },
    configuracion: { view: false, edit: false },
    usuarios: { view: false, edit: false },
    permisos: { view: false, edit: false },
  },
  // Preparado para Fase 2:
  cliente: {
    dashboard: { view: true, edit: false },
    ordenes: { view: true, edit: false },
  },
};

// ---------- Clientes ----------
export const clientes: Cliente[] = [
  {
    id: "cli-1",
    nombre: "Grupo Andes Propiedades",
    razonSocial: "Andes Bienes Raíces S.A.",
    tipoCliente: "inmobiliaria",
    telefono: "+54 261 423 1100",
    redes: { instagram: "@andespropiedades" },
    web: "https://andespropiedades.com.ar",
    notas: "Cartera grande de departamentos en Ciudad y Godoy Cruz.",
  },
  {
    id: "cli-2",
    nombre: "Bodega Alta Luz",
    razonSocial: "Alta Luz Wines S.R.L.",
    tipoCliente: "destino_turistico",
    telefono: "+54 261 490 2200",
    redes: { instagram: "@bodegaaltaluz", facebook: "bodegaaltaluz" },
    web: "https://altaluzwines.com",
    notas: "Enoturismo. Buscan tour virtual + reel para temporada alta.",
  },
  {
    id: "cli-3",
    nombre: "Hotel Cumbre Blanca",
    razonSocial: "Cumbre Blanca Hotelería S.A.",
    tipoCliente: "destino_turistico",
    telefono: "+54 2622 44 3300",
    redes: { instagram: "@hotelcumbreblanca" },
    web: "https://cumbreblanca.com.ar",
    notas: "Hotel de montaña en Uspallata.",
  },
  {
    id: "cli-4",
    nombre: "Resto Parrilla El Pampero",
    razonSocial: "El Pampero Gastronomía S.A.S.",
    tipoCliente: "otros",
    telefono: "+54 261 425 4400",
    redes: { instagram: "@elpampero.resto" },
    web: "",
    notas: "Quiere pack de fotos + tour para reservas.",
  },
];

// ---------- Destinos ----------
export const destinos: Destino[] = [
  {
    id: "des-1",
    clienteId: "cli-1",
    nombre: "Depto Torre Aconcagua Piso 12",
    direccion: "Av. San Martín 1200, Mendoza",
    distanciaKm: 8,
    telefono: "+54 261 423 1100",
    redes: {},
    web: "",
    vertical: "real_estate",
    campos: [
      { id: "c1", label: "M² cubiertos", value: "95" },
      { id: "c2", label: "M² terreno", value: "200" },
    ],
  },
  {
    id: "des-2",
    clienteId: "cli-2",
    nombre: "Bodega Alta Luz — Finca Agrelo",
    direccion: "Ruta 15 km 32, Agrelo, Luján de Cuyo",
    distanciaKm: 42,
    telefono: "+54 261 490 2200",
    redes: { instagram: "@bodegaaltaluz" },
    web: "https://altaluzwines.com",
    vertical: "bodega",
    campos: [{ id: "c1", label: "Hectáreas", value: "60" }],
  },
  {
    id: "des-3",
    clienteId: "cli-3",
    nombre: "Hotel Cumbre Blanca — Uspallata",
    direccion: "Los Cóndores s/n, Uspallata",
    distanciaKm: 105,
    telefono: "+54 2622 44 3300",
    redes: {},
    web: "",
    vertical: "hotel",
    campos: [{ id: "c1", label: "Habitaciones", value: "48" }],
  },
  {
    id: "des-4",
    clienteId: "cli-4",
    nombre: "El Pampero — Salón Centro",
    direccion: "Sarmiento 450, Ciudad de Mendoza",
    distanciaKm: 6,
    telefono: "+54 261 425 4400",
    redes: {},
    web: "",
    vertical: "restaurante",
    campos: [{ id: "c1", label: "Mesas", value: "30" }],
  },
];

// ---------- Servicios (catálogo precargado) ----------
// costo = lo que me cuesta (pago a los chicos) · precioBase = precio final al cliente
export const servicios: Servicio[] = [
  { id: "srv-1", tipo: "tour_virtual", nombre: "Tour virtual (mínimo 5 panoramas)", unidad: "tour", costo: 22000, precioBase: 65000 },
  { id: "srv-2", tipo: "adicional", nombre: "Pack x3 panoramas adicional", unidad: "pack", costo: 8000, precioBase: 24000 },
  { id: "srv-3", tipo: "adicional", nombre: "Pack x5 panoramas adicional", unidad: "pack", costo: 12000, precioBase: 36000 },
  { id: "srv-4", tipo: "adicional", nombre: "Pack x10 panoramas adicional", unidad: "pack", costo: 22000, precioBase: 64000 },
  { id: "srv-5", tipo: "video_reel", nombre: "Video reel 60 seg", unidad: "video", costo: 20000, precioBase: 55000 },
  { id: "srv-6", tipo: "video_reel", nombre: "Video 360 1 min", unidad: "video", costo: 26000, precioBase: 68000 },
  { id: "srv-7", tipo: "pack_fotos", nombre: "Pack fotos x25", unidad: "pack", costo: 11000, precioBase: 30000 },
  { id: "srv-8", tipo: "dron", nombre: "Fotos/video aéreo con dron", unidad: "servicio", costo: 18000, precioBase: 48000 },
  { id: "srv-9", tipo: "adicional", nombre: "10 seg adicional video plano", unidad: "adicional", costo: 3000, precioBase: 9000 },
  { id: "srv-10", tipo: "adicional", nombre: "10 seg adicional video 360", unidad: "adicional", costo: 4000, precioBase: 11000 },
];

// ---------- Costos fijos y variables ----------
export const costos: Costo[] = [
  {
    id: "cos-1",
    nombre: "Alquiler oficina/estudio",
    tipo: "fijo",
    precio: 180000,
    cantidad: 1,
    frecuencia: "mensual",
  },
  {
    id: "cos-2",
    nombre: "Software edición (Adobe CC)",
    tipo: "fijo",
    precio: 42000,
    cantidad: 1,
    frecuencia: "mensual",
  },
  {
    id: "cos-3",
    nombre: "Seguro equipo fotográfico",
    tipo: "fijo",
    precio: 96000,
    cantidad: 1,
    frecuencia: "anual",
  },
  {
    id: "cos-4",
    nombre: "Combustible por trabajo",
    tipo: "variable",
    precio: 12000,
    cantidad: 1,
    frecuencia: "por_trabajo",
  },
  {
    id: "cos-5",
    nombre: "Hosting tours virtuales",
    tipo: "fijo",
    precio: 15000,
    cantidad: 1,
    frecuencia: "mensual",
  },
];

// ---------- Empleados ----------
export const empleados: Empleado[] = [
  { id: "emp-1", nombre: "Diego Relevador", puesto: "relevador", telefono: "+54 9 261 555 6001", email: "diego@elfaro360.com" },
  { id: "emp-2", nombre: "Sofi Editora", puesto: "editor_video", telefono: "+54 9 261 555 6002", email: "sofi@elfaro360.com" },
  { id: "emp-3", nombre: "Martín Foto", puesto: "editor_fotos", telefono: "+54 9 261 555 6003", email: "martin@elfaro360.com" },
  { id: "emp-4", nombre: "Ana Dron", puesto: "dron", telefono: "+54 9 261 555 6004", email: "ana@elfaro360.com" },
];

// ---------- Presupuestos ----------
export const presupuestos: Presupuesto[] = [
  {
    id: "pre-1",
    numero: "P-2026-001",
    clienteId: "cli-2",
    destinoId: "des-2",
    fecha: "2026-07-10",
    items: [
      { servicioId: "srv-1", nombre: "Tour virtual (mínimo 5 panoramas)", cantidad: 1, precioUnitario: 65000, costoUnitario: 22000 },
      { servicioId: "srv-5", nombre: "Video reel 60 seg", cantidad: 1, precioUnitario: 55000, costoUnitario: 20000 },
      { servicioId: "srv-8", nombre: "Fotos/video aéreo con dron", cantidad: 1, precioUnitario: 48000, costoUnitario: 18000 },
    ],
    metodoPago: "transferencia",
    config: {
      manoObra: 60000,
      manoObraOverride: null,
      estructura: 18000,
      estructuraOverride: null,
      trasladoAuto: 55000,
      trasladoOverride: null,
      garantiaPct: 5,
      margenPct: 35,
      ivaPct: 21,
      conIva: true,
      materialesFacturables: 0,
      descuentoValor: 0,
      descuentoEsPorcentaje: true,
    },
    estado: "aprobado",
    notas: "Campaña temporada alta enoturismo.",
  },
  {
    id: "pre-2",
    numero: "P-2026-002",
    clienteId: "cli-1",
    destinoId: "des-1",
    fecha: "2026-07-22",
    items: [
      { servicioId: "srv-1", nombre: "Tour virtual (mínimo 5 panoramas)", cantidad: 1, precioUnitario: 65000, costoUnitario: 22000 },
      { servicioId: "srv-7", nombre: "Pack fotos x25", cantidad: 1, precioUnitario: 30000, costoUnitario: 11000 },
    ],
    metodoPago: "efectivo",
    config: {
      manoObra: 33000,
      manoObraOverride: null,
      estructura: 18000,
      estructuraOverride: null,
      trasladoAuto: 30000,
      trasladoOverride: null,
      garantiaPct: 5,
      margenPct: 35,
      ivaPct: 21,
      conIva: true,
      materialesFacturables: 0,
      descuentoValor: 0,
      descuentoEsPorcentaje: true,
    },
    estado: "enviado",
    notas: "",
  },
  {
    id: "pre-3",
    numero: "P-2026-003",
    clienteId: "cli-3",
    destinoId: "des-3",
    fecha: "2026-07-28",
    items: [
      { servicioId: "srv-1", nombre: "Tour virtual (mínimo 5 panoramas)", cantidad: 1, precioUnitario: 65000, costoUnitario: 22000 },
      { servicioId: "srv-4", nombre: "Pack x10 panoramas adicional", cantidad: 1, precioUnitario: 64000, costoUnitario: 22000 },
      { servicioId: "srv-6", nombre: "Video 360 1 min", cantidad: 1, precioUnitario: 68000, costoUnitario: 26000 },
    ],
    metodoPago: "cuotas_2",
    config: {
      manoObra: 70000,
      manoObraOverride: null,
      estructura: 18000,
      estructuraOverride: null,
      trasladoAuto: 0,
      trasladoOverride: 90000,
      garantiaPct: 5,
      margenPct: 35,
      ivaPct: 21,
      conIva: true,
      materialesFacturables: 0,
      descuentoValor: 0,
      descuentoEsPorcentaje: true,
    },
    estado: "borrador",
    notas: "Hotel de montaña, cotización con recargo por cuotas.",
  },
];

// ---------- Órdenes de trabajo ----------
export const ordenes: OrdenTrabajo[] = [
  {
    id: "ord-1",
    numero: "OT-2026-001",
    presupuestoId: "pre-1",
    clienteId: "cli-2",
    destinoId: "des-2",
    fechaCreacion: "2026-07-12",
    etapas: [
      { key: "aprobado", empleadoIds: ["emp-1"], fechaEstimada: "2026-08-05", fechaReal: "2026-08-05", estado: "completado", notas: "Coordinado con la bodega." },
      { key: "relevamiento", empleadoIds: ["emp-1"], fechaEstimada: "2026-08-06", fechaReal: "2026-08-06", estado: "completado", notas: "Se sumó dron al atardecer." },
      { key: "edicion", empleadoIds: ["emp-2"], fechaEstimada: "2026-08-12", fechaReal: null, estado: "en_curso", notas: "" },
      { key: "publicacion", empleadoIds: ["emp-2"], fechaEstimada: "2026-08-15", fechaReal: null, estado: "pendiente", notas: "" },
      { key: "entregable", empleadoIds: [], fechaEstimada: "2026-08-16", fechaReal: null, estado: "pendiente", notas: "" },
    ],
  },
  {
    id: "ord-2",
    numero: "OT-2026-002",
    presupuestoId: "pre-2",
    clienteId: "cli-1",
    destinoId: "des-1",
    fechaCreacion: "2026-07-24",
    etapas: [
      { key: "aprobado", empleadoIds: ["emp-1"], fechaEstimada: "2026-08-04", fechaReal: null, estado: "en_curso", notas: "" },
      { key: "relevamiento", empleadoIds: ["emp-1"], fechaEstimada: "2026-08-08", fechaReal: null, estado: "pendiente", notas: "" },
      { key: "edicion", empleadoIds: ["emp-3"], fechaEstimada: "2026-08-11", fechaReal: null, estado: "pendiente", notas: "" },
      { key: "publicacion", empleadoIds: ["emp-2"], fechaEstimada: "2026-08-14", fechaReal: null, estado: "pendiente", notas: "" },
      { key: "entregable", empleadoIds: [], fechaEstimada: "2026-08-15", fechaReal: null, estado: "pendiente", notas: "" },
    ],
  },
];

// ---------- Pagos a empleados ----------
export const pagosEmpleados: PagoEmpleado[] = [
  { id: "pag-1", empleadoId: "emp-1", ordenId: "ord-1", etapa: "aprobado", concepto: "", monto: 8000, estado: "pagado", fecha: "2026-08-05" },
  { id: "pag-2", empleadoId: "emp-1", ordenId: "ord-1", etapa: "relevamiento", concepto: "", monto: 22000, estado: "pagado", fecha: "2026-08-07" },
  { id: "pag-3", empleadoId: "emp-2", ordenId: "ord-1", etapa: "edicion", concepto: "", monto: 26000, estado: "pendiente", fecha: null },
  { id: "pag-4", empleadoId: "emp-1", ordenId: "ord-2", etapa: "aprobado", concepto: "", monto: 8000, estado: "pendiente", fecha: null },
  { id: "pag-5", empleadoId: "emp-3", ordenId: "ord-2", etapa: "edicion", concepto: "", monto: 20000, estado: "pendiente", fecha: null },
];

// ---------- Cobros ----------
export const cobros: Cobro[] = [
  { id: "cob-1", presupuestoId: "pre-1", clienteId: "cli-2", metodo: "transferencia", importe: 280000, estado: "cobrado", fecha: "2026-07-15" },
  { id: "cob-2", presupuestoId: "pre-2", clienteId: "cli-1", metodo: "efectivo", importe: 160000, estado: "pendiente", fecha: null },
];

// ---------- Notas / tareas de agenda ----------
export const notasAgenda: AgendaNota[] = [];
