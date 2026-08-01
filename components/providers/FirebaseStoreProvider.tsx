"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StoreCtx, useStore, type StoreValue } from "./store-context";
import * as mock from "@/lib/mock-data";
import {
  deleteDocById,
  fetchCollection,
  fetchPermissions,
  savePermissions,
  upsertDoc,
  type CollectionName,
} from "@/lib/firestore";
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

export { useStore };

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

/** Colección con estado local + escritura a Firestore (write-through). */
function useFsCollection<T extends { id: string }>(name: CollectionName) {
  const [items, setItems] = useState<T[]>([]);
  const add = useCallback((x: T) => {
    setItems((p) => [x, ...p]);
    void upsertDoc(name, x).catch((e) => console.error(`[${name}] add`, e));
  }, [name]);
  const update = useCallback((x: T) => {
    setItems((p) => p.map((i) => (i.id === x.id ? x : i)));
    void upsertDoc(name, x).catch((e) => console.error(`[${name}] update`, e));
  }, [name]);
  const remove = useCallback((id: string) => {
    setItems((p) => p.filter((i) => i.id !== id));
    void deleteDocById(name, id).catch((e) => console.error(`[${name}] remove`, e));
  }, [name]);
  return { items, add, update, remove, setItems };
}

export function FirebaseStoreProvider({ children }: { children: React.ReactNode }) {
  const users = useFsCollection<User>("users");
  const clientes = useFsCollection<Cliente>("clientes");
  const destinos = useFsCollection<Destino>("destinos");
  const servicios = useFsCollection<Servicio>("servicios");
  const costos = useFsCollection<Costo>("costos");
  const presupuestos = useFsCollection<Presupuesto>("presupuestos");
  const ordenes = useFsCollection<OrdenTrabajo>("ordenes");
  const empleados = useFsCollection<Empleado>("empleados");
  const pagos = useFsCollection<PagoEmpleado>("pagosEmpleados");
  const cobros = useFsCollection<Cobro>("cobros");

  const [permissions, setPermissions] = useState<PermissionMatrix>(() => clone(mock.permissionMatrix));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Carga inicial desde Firestore
  useEffect(() => {
    let alive = true;
    (async () => {
      const [u, cl, de, se, co, pr, or, em, pa, cb, perms] = await Promise.all([
        fetchCollection<User>("users"),
        fetchCollection<Cliente>("clientes"),
        fetchCollection<Destino>("destinos"),
        fetchCollection<Servicio>("servicios"),
        fetchCollection<Costo>("costos"),
        fetchCollection<Presupuesto>("presupuestos"),
        fetchCollection<OrdenTrabajo>("ordenes"),
        fetchCollection<Empleado>("empleados"),
        fetchCollection<PagoEmpleado>("pagosEmpleados"),
        fetchCollection<Cobro>("cobros"),
        fetchPermissions(),
      ]);
      if (!alive) return;
      users.setItems(u);
      clientes.setItems(cl);
      destinos.setItems(de);
      servicios.setItems(se);
      costos.setItems(co);
      presupuestos.setItems(pr);
      ordenes.setItems(or);
      empleados.setItems(em);
      pagos.setItems(pa);
      cobros.setItems(cb);
      if (perms) setPermissions(perms);

      // Restaurar sesión
      const id = window.localStorage.getItem("elfaro-user");
      if (id) {
        const found = u.find((x) => x.id === id);
        if (found) setCurrentUser(found);
      }
      setLoading(false);
    })().catch((e) => {
      console.error("[firebase] carga inicial", e);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((userId: string) => {
    const u = users.items.find((x) => x.id === userId) ?? null;
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
        if (field === "edit" && value) current.view = true;
        if (field === "view" && !value) current.edit = false;
        next[role][module] = current;
        void savePermissions(next).catch((e) => console.error("[permissions] save", e));
        return next;
      });
    },
    []
  );

  const can = useCallback(
    (module: ModuleKey, field: "view" | "edit" = "view") => {
      if (!currentUser) return false;
      return !!permissions[currentUser.role]?.[module]?.[field];
    },
    [currentUser, permissions]
  );

  const value: StoreValue = useMemo(
    () => ({
      loading,
      backend: "firebase" as const,
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
    [loading, currentUser, login, logout, setRole, permissions, setPermission, can,
      users, clientes, destinos, servicios, costos, presupuestos, ordenes, empleados, pagos, cobros]
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
