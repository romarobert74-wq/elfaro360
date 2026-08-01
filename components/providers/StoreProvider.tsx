"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as mock from "@/lib/mock-data";
import type {
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

// Clona los arrays mock para poder mutarlos en memoria sin tocar la fuente
function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

interface StoreValue {
  // Auth
  currentUser: User | null;
  login: (userId: string) => void;
  logout: () => void;
  setRole: (role: Role) => void; // switcher rápido de rol (demo)

  // Permisos
  permissions: PermissionMatrix;
  setPermission: (role: Role, module: ModuleKey, field: "view" | "edit", value: boolean) => void;
  can: (module: ModuleKey, field?: "view" | "edit") => boolean;

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
}

const Ctx = createContext<StoreValue | null>(null);

function useCollection<T extends { id: string }>(initial: T[]) {
  const [items, setItems] = useState<T[]>(() => clone(initial));
  const add = useCallback((x: T) => setItems((p) => [x, ...p]), []);
  const update = useCallback(
    (x: T) => setItems((p) => p.map((i) => (i.id === x.id ? x : i))),
    []
  );
  const remove = useCallback((id: string) => setItems((p) => p.filter((i) => i.id !== id)), []);
  return { items, add, update, remove, setItems };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const users = useCollection<User>(mock.users);
  const clientes = useCollection<Cliente>(mock.clientes);
  const destinos = useCollection<Destino>(mock.destinos);
  const servicios = useCollection<Servicio>(mock.servicios);
  const costos = useCollection<Costo>(mock.costos);
  const presupuestos = useCollection<Presupuesto>(mock.presupuestos);
  const ordenes = useCollection<OrdenTrabajo>(mock.ordenes);
  const empleados = useCollection<Empleado>(mock.empleados);
  const pagos = useCollection<PagoEmpleado>(mock.pagosEmpleados);
  const cobros = useCollection<Cobro>(mock.cobros);

  const [permissions, setPermissions] = useState<PermissionMatrix>(() => clone(mock.permissionMatrix));
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Restaurar sesión (solo el usuario; los datos siempre parten del mock)
  useEffect(() => {
    const id = window.localStorage.getItem("elfaro-user");
    if (id) {
      const u = mock.users.find((x) => x.id === id);
      if (u) setCurrentUser(u);
    }
  }, []);

  const login = useCallback((userId: string) => {
    const u = users.items.find((x) => x.id === userId) ?? mock.users.find((x) => x.id === userId) ?? null;
    if (u) {
      setCurrentUser(u);
      window.localStorage.setItem("elfaro-user", u.id);
    }
  }, [users.items]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    window.localStorage.removeItem("elfaro-user");
  }, []);

  const setRole = useCallback((role: Role) => {
    setCurrentUser((u) => (u ? { ...u, role } : u));
  }, []);

  const setPermission = useCallback(
    (role: Role, module: ModuleKey, field: "view" | "edit", value: boolean) => {
      setPermissions((prev) => {
        const next = clone(prev);
        const current = next[role][module] ?? { view: false, edit: false };
        current[field] = value;
        // editar implica ver
        if (field === "edit" && value) current.view = true;
        if (field === "view" && !value) current.edit = false;
        next[role][module] = current;
        return next;
      });
    },
    []
  );

  const can = useCallback(
    (module: ModuleKey, field: "view" | "edit" = "view") => {
      if (!currentUser) return false;
      const perm = permissions[currentUser.role]?.[module];
      return !!perm?.[field];
    },
    [currentUser, permissions]
  );

  const value: StoreValue = useMemo(
    () => ({
      currentUser,
      login,
      logout,
      setRole,
      permissions,
      setPermission,
      can,
      users: users.items,
      clientes: clientes.items,
      destinos: destinos.items,
      servicios: servicios.items,
      costos: costos.items,
      presupuestos: presupuestos.items,
      ordenes: ordenes.items,
      empleados: empleados.items,
      pagosEmpleados: pagos.items,
      cobros: cobros.items,
      addUser: users.add, updateUser: users.update, removeUser: users.remove,
      addCliente: clientes.add, updateCliente: clientes.update, removeCliente: clientes.remove,
      addDestino: destinos.add, updateDestino: destinos.update, removeDestino: destinos.remove,
      addServicio: servicios.add, updateServicio: servicios.update, removeServicio: servicios.remove,
      addCosto: costos.add, updateCosto: costos.update, removeCosto: costos.remove,
      addPresupuesto: presupuestos.add, updatePresupuesto: presupuestos.update, removePresupuesto: presupuestos.remove,
      addOrden: ordenes.add, updateOrden: ordenes.update, removeOrden: ordenes.remove,
      addEmpleado: empleados.add, updateEmpleado: empleados.update, removeEmpleado: empleados.remove,
      addPago: pagos.add, updatePago: pagos.update, removePago: pagos.remove,
      addCobro: cobros.add, updateCobro: cobros.update, removeCobro: cobros.remove,
    }),
    [currentUser, login, logout, setRole, permissions, setPermission, can,
      users, clientes, destinos, servicios, costos, presupuestos, ordenes, empleados, pagos, cobros]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
