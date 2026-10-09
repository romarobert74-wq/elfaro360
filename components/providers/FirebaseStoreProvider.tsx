"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { StoreCtx, useStore, type StoreValue } from "./store-context";
import * as mock from "@/lib/mock-data";
import { getFirebase } from "@/lib/firebase";
import { normalizeOrden } from "@/lib/orders";
import { normalizePago } from "@/lib/pagos";
import { normalizeRelevamiento } from "@/lib/relevamiento";
import {
  deleteDocById,
  fetchCollection,
  fetchPermissions,
  fetchSettings,
  savePermissions,
  saveSettings,
  upsertDoc,
  type CollectionName,
} from "@/lib/firestore";
import type {
  AgendaNota,
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
  Relevamiento,
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
  const relevamientos = useFsCollection<Relevamiento>("relevamientos");
  const empleados = useFsCollection<Empleado>("empleados");
  const pagos = useFsCollection<PagoEmpleado>("pagosEmpleados");
  const cobros = useFsCollection<Cobro>("cobros");
  const notas = useFsCollection<AgendaNota>("notasAgenda");

  const [permissions, setPermissions] = useState<PermissionMatrix>(() => clone(mock.permissionMatrix));
  const [settings, setSettingsState] = useState(() => clone(mock.appSettings));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [loadOk, setLoadOk] = useState(false); // true solo si la carga inicial de datos funcionó
  const [authError, setAuthError] = useState<string | null>(null);
  const loading = !authReady || !dataReady;

  const updateSettings = useCallback((s: typeof settings) => {
    setSettingsState(s);
    void saveSettings(s).catch((e) => console.error("[settings] save", e));
  }, []);

  // Carga de datos desde Firestore. Las Reglas exigen estar autenticado, así
  // que SOLO cargamos una vez que hay sesión. Sin sesión mostramos el login sin
  // intentar leer (si no, el read se rechaza y queda el error de "no se pudieron
  // cargar los datos" para siempre). Al autenticar, este efecto vuelve a correr
  // con el token válido y recarga todo.
  useEffect(() => {
    if (!authReady) return; // todavía no sabemos si hay sesión
    if (!authUser) {
      // Sin usuario autenticado: no leemos (las reglas lo rechazarían). Mostramos login.
      setLoadOk(false);
      setDataReady(true);
      return;
    }
    let alive = true;
    setDataReady(false); // recargando con el token válido
    (async () => {
      try {
        const [u, cl, de, se, co, pr, or, re, em, pa, cb, nt, perms, sett] = await Promise.all([
          fetchCollection<User>("users"),
          fetchCollection<Cliente>("clientes"),
          fetchCollection<Destino>("destinos"),
          fetchCollection<Servicio>("servicios"),
          fetchCollection<Costo>("costos"),
          fetchCollection<Presupuesto>("presupuestos"),
          fetchCollection<OrdenTrabajo>("ordenes"),
          fetchCollection<Relevamiento>("relevamientos"),
          fetchCollection<Empleado>("empleados"),
          fetchCollection<PagoEmpleado>("pagosEmpleados"),
          fetchCollection<Cobro>("cobros"),
          fetchCollection<AgendaNota>("notasAgenda"),
          fetchPermissions(),
          fetchSettings(),
        ]);
        if (!alive) return;
        users.setItems(u);
        clientes.setItems(cl);
        destinos.setItems(de);
        servicios.setItems(se);
        costos.setItems(co);
        presupuestos.setItems(pr);
        ordenes.setItems(or.map(normalizeOrden));
        relevamientos.setItems(re.map(normalizeRelevamiento));
        empleados.setItems(em);
        pagos.setItems(pa.map(normalizePago));
        cobros.setItems(cb);
        notas.setItems(nt);
        // Combina la matriz guardada con los valores por defecto, para que los
        // módulos nuevos (ej. relevamientos) aparezcan aunque Firestore tenga una
        // matriz vieja. Lo guardado tiene prioridad sobre el default.
        if (perms) {
          const base = clone(mock.permissionMatrix) as PermissionMatrix;
          (Object.keys(perms) as (keyof PermissionMatrix)[]).forEach((role) => {
            base[role] = { ...base[role], ...perms[role] };
          });
          setPermissions(base);
        }
        if (sett) setSettingsState(sett);
        setLoadOk(true);
      } catch (e) {
        if (!alive) return;
        console.error("[firebase] carga de datos", e);
        setLoadOk(false);
      } finally {
        if (alive) setDataReady(true);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, authUser]);

  // Escuchar el estado de autenticación (Firebase Auth)
  useEffect(() => {
    const { auth } = getFirebase();
    if (!auth) {
      setAuthReady(true);
      return;
    }
    // Completa el login con Google por redirect (celular) y surfacea errores.
    getRedirectResult(auth).catch((e) => console.error("[firebase] redirect result", e));
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setAuthUser(fbUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Mapear el usuario autenticado -> ficha en la colección `users` (por email)
  useEffect(() => {
    if (!authReady || !dataReady) return;
    if (!authUser) {
      setCurrentUser(null);
      return;
    }
    const email = (authUser.email ?? "").trim().toLowerCase();
    const found = users.items.find((u) => (u.email ?? "").trim().toLowerCase() === email);
    if (found && found.activo) {
      setCurrentUser(found);
      setAuthError(null);
    } else if (found && !found.activo) {
      // El usuario existe pero está marcado como inactivo.
      setCurrentUser(null);
      setAuthError(`Tu cuenta (${email}) está desactivada. Pedile a un administrador que la active.`);
    } else if (loadOk && users.items.length === 0) {
      // Bootstrap: base REALMENTE vacía (y la carga funcionó) → el primer usuario
      // autenticado entra como super_admin para poder correr el seed inicial.
      setCurrentUser({ id: "bootstrap", nombre: authUser.displayName || email, email, role: "super_admin", activo: true });
      setAuthError(null);
    } else if (!loadOk) {
      // La carga de datos falló (reglas de Firestore, conexión, etc.). NO damos
      // super_admin: mostramos error para que se revise, sin escalar permisos.
      setCurrentUser(null);
      setAuthError("No se pudieron cargar los datos. Revisá las Reglas de Firestore (deben permitir lectura a usuarios autenticados) y volvé a intentar.");
    } else {
      // Autenticó con Google pero no hay ficha de usuario con ese email.
      setCurrentUser(null);
      setAuthError(`La cuenta ${email} no está autorizada en El Faro 360. Verificá que un administrador la haya dado de alta con ese mismo email exacto.`);
    }
  }, [authUser, authReady, dataReady, loadOk, users.items]);

  const login = useCallback((_userId: string) => {
    // Demo (modo mock). En Firebase se usa loginWithEmail / loginWithGoogle.
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const { auth } = getFirebase();
    if (!auth) throw new Error("Firebase no está configurado.");
    setAuthError(null);
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { auth } = getFirebase();
    if (!auth) throw new Error("Firebase no está configurado.");
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    // Siempre deja elegir la cuenta (evita que el celular entre con otra cuenta de Google por defecto).
    provider.setCustomParameters({ prompt: "select_account" });
    // Popup primero: completa el login en su propia ventana y devuelve el
    // resultado directo. Es mucho más confiable que redirect, que hoy se rompe
    // por el bloqueo de cookies de terceros (el usuario vuelve al login sin sesión).
    try {
      await signInWithPopup(auth, provider);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // El usuario cerró el popup: no es un error real, no mostramos nada.
        return;
      }
      if (code === "auth/popup-blocked") {
        // El navegador bloqueó el popup → último recurso: redirect.
        await signInWithRedirect(auth, provider);
        return;
      }
      console.error("[firebase] loginWithGoogle", e);
      setAuthError("No se pudo iniciar sesión con Google. Probá de nuevo o avisá al administrador.");
    }
  }, []);

  const logout = useCallback(() => {
    const { auth } = getFirebase();
    setCurrentUser(null);
    setAuthError(null);
    if (auth) void signOut(auth);
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
      loginWithEmail,
      loginWithGoogle,
      logout,
      setRole,
      authError,
      permissions,
      setPermission,
      can,
      settings,
      updateSettings,
      users: users.items,
      clientes: clientes.items,
      destinos: destinos.items,
      servicios: servicios.items,
      costos: costos.items,
      presupuestos: presupuestos.items,
      ordenes: ordenes.items,
      relevamientos: relevamientos.items,
      empleados: empleados.items,
      pagosEmpleados: pagos.items,
      cobros: cobros.items,
      notasAgenda: notas.items,
      addUser: users.add, updateUser: users.update, removeUser: users.remove,
      addCliente: clientes.add, updateCliente: clientes.update, removeCliente: clientes.remove,
      addDestino: destinos.add, updateDestino: destinos.update, removeDestino: destinos.remove,
      addServicio: servicios.add, updateServicio: servicios.update, removeServicio: servicios.remove,
      addCosto: costos.add, updateCosto: costos.update, removeCosto: costos.remove,
      addPresupuesto: presupuestos.add, updatePresupuesto: presupuestos.update, removePresupuesto: presupuestos.remove,
      addOrden: ordenes.add, updateOrden: ordenes.update, removeOrden: ordenes.remove,
      addRelevamiento: relevamientos.add, updateRelevamiento: relevamientos.update, removeRelevamiento: relevamientos.remove,
      addEmpleado: empleados.add, updateEmpleado: empleados.update, removeEmpleado: empleados.remove,
      addPago: pagos.add, updatePago: pagos.update, removePago: pagos.remove,
      addCobro: cobros.add, updateCobro: cobros.update, removeCobro: cobros.remove,
      addNota: notas.add, updateNota: notas.update, removeNota: notas.remove,
    }),
    [loading, currentUser, login, loginWithEmail, loginWithGoogle, logout, setRole, authError, permissions, setPermission, can, settings, updateSettings,
      users, clientes, destinos, servicios, costos, presupuestos, ordenes, relevamientos, empleados, pagos, cobros, notas]
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
