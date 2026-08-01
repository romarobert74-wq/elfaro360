import type { ModuleKey } from "./types";

export interface NavItem {
  key: ModuleKey;
  label: string;
  href: string;
  icon: string;
  group: "Principal" | "Comercial" | "Producción" | "Finanzas" | "Sistema";
}

export const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/", icon: "dashboard", group: "Principal" },

  { key: "clientes", label: "Clientes", href: "/clientes", icon: "clientes", group: "Comercial" },
  { key: "destinos", label: "Destinos", href: "/destinos", icon: "destinos", group: "Comercial" },
  { key: "servicios", label: "Servicios", href: "/servicios", icon: "servicios", group: "Comercial" },
  { key: "presupuestos", label: "Presupuestos", href: "/presupuestos", icon: "presupuestos", group: "Comercial" },

  { key: "ordenes", label: "Órdenes de Trabajo", href: "/ordenes", icon: "ordenes", group: "Producción" },
  { key: "agenda", label: "Agenda", href: "/agenda", icon: "agenda", group: "Producción" },
  { key: "empleados", label: "Empleados", href: "/empleados", icon: "empleados", group: "Producción" },

  { key: "costos", label: "Costos", href: "/costos", icon: "costos", group: "Finanzas" },
  { key: "pagos", label: "Pagos a Empleados", href: "/pagos", icon: "pagos", group: "Finanzas" },
  { key: "cobros", label: "Cobros", href: "/cobros", icon: "cobros", group: "Finanzas" },
  { key: "reportes", label: "Reportes", href: "/reportes", icon: "reportes", group: "Finanzas" },

  { key: "usuarios", label: "Usuarios y Roles", href: "/usuarios", icon: "usuarios", group: "Sistema" },
  { key: "permisos", label: "Permisos", href: "/configuracion/permisos", icon: "permisos", group: "Sistema" },
];

export const navGroups: NavItem["group"][] = [
  "Principal",
  "Comercial",
  "Producción",
  "Finanzas",
  "Sistema",
];
