"use client";

import { createContext, useContext } from "react";
import type {
  AgendaNota,
  AppSettings,
  Cliente,
  Cobro,
  Costo,
  Destino,
  Empleado,
  ModuleKey,
  OrdenTrabajo,
  PagoEmpleado,
  PermissionMatrix,
  Presupuesto,
  Role,
  Servicio,
  User,
} from "@/lib/types";

/**
 * Interfaz común del store. La implementan dos providers intercambiables:
 *  - StoreProvider (mock en memoria) — default, Fase 1
 *  - FirebaseStoreProvider (Firestore) — Fase 2, se activa por env
 * Toda la UI consume `useStore()` sin saber qué backend hay detrás.
 */
export interface StoreValue {
  // Estado de carga (Firebase carga async; mock es inmediato)
  loading: boolean;
  backend: "mock" | "firebase";

  // Auth
  currentUser: User | null;
  login: (userId: string) => void; // demo (modo mock): elegir usuario
  loginWithEmail: (email: string, password: string) => Promise<void>; // Firebase Auth
  loginWithGoogle: () => Promise<void>; // Firebase Auth
  logout: () => void;
  setRole: (role: Role) => void;
  authError: string | null; // ej. "cuenta no autorizada"

  // Permisos
  permissions: PermissionMatrix;
  setPermission: (role: Role, module: ModuleKey, field: "view" | "edit", value: boolean) => void;
  can: (module: ModuleKey, field?: "view" | "edit") => boolean;

  // Configuración global
  settings: AppSettings;
  updateSettings: (s: AppSettings) => void;

  // Colecciones
  users: User[];
  clientes: Cliente[];
  destinos: Destino[];
  servicios: Servicio[];
  costos: Costo[];
  presupuestos: Presupuesto[];
  ordenes: OrdenTrabajo[];
  empleados: Empleado[];
  pagosEmpleados: PagoEmpleado[];
  cobros: Cobro[];
  notasAgenda: AgendaNota[];

  // CRUD genérico por colección
  addUser: (x: User) => void; updateUser: (x: User) => void; removeUser: (id: string) => void;
  addCliente: (x: Cliente) => void; updateCliente: (x: Cliente) => void; removeCliente: (id: string) => void;
  addDestino: (x: Destino) => void; updateDestino: (x: Destino) => void; removeDestino: (id: string) => void;
  addServicio: (x: Servicio) => void; updateServicio: (x: Servicio) => void; removeServicio: (id: string) => void;
  addCosto: (x: Costo) => void; updateCosto: (x: Costo) => void; removeCosto: (id: string) => void;
  addPresupuesto: (x: Presupuesto) => void; updatePresupuesto: (x: Presupuesto) => void; removePresupuesto: (id: string) => void;
  addOrden: (x: OrdenTrabajo) => void; updateOrden: (x: OrdenTrabajo) => void; removeOrden: (id: string) => void;
  addEmpleado: (x: Empleado) => void; updateEmpleado: (x: Empleado) => void; removeEmpleado: (id: string) => void;
  addPago: (x: PagoEmpleado) => void; updatePago: (x: PagoEmpleado) => void; removePago: (id: string) => void;
  addCobro: (x: Cobro) => void; updateCobro: (x: Cobro) => void; removeCobro: (id: string) => void;
  addNota: (x: AgendaNota) => void; updateNota: (x: AgendaNota) => void; removeNota: (id: string) => void;
}

export const StoreCtx = createContext<StoreValue | null>(null);

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within a Store provider");
  return ctx;
}
