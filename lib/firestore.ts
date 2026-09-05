import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { getFirebase } from "./firebase";
import * as mock from "./mock-data";
import { uid } from "./format";
import type { AppSettings, PermissionMatrix, User } from "./types";

// Nombres de colecciones en Firestore (una por entidad).
export const COLLECTIONS = {
  users: "users",
  clientes: "clientes",
  destinos: "destinos",
  servicios: "servicios",
  costos: "costos",
  presupuestos: "presupuestos",
  ordenes: "ordenes",
  empleados: "empleados",
  pagosEmpleados: "pagosEmpleados",
  cobros: "cobros",
  notasAgenda: "notasAgenda",
} as const;

export type CollectionName = keyof typeof COLLECTIONS;

const META_DOC = { col: "meta", id: "permissions" };
const SETTINGS_DOC = { col: "meta", id: "settings" };

// ---------- Lectura ----------
export async function fetchCollection<T>(name: CollectionName): Promise<T[]> {
  const { db } = getFirebase();
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS[name]));
  return snap.docs.map((d) => d.data() as T);
}

export async function fetchPermissions(): Promise<PermissionMatrix | null> {
  const { db } = getFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, META_DOC.col, META_DOC.id));
  return snap.exists() ? (snap.data() as PermissionMatrix) : null;
}

export async function fetchSettings(): Promise<AppSettings | null> {
  const { db } = getFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, SETTINGS_DOC.col, SETTINGS_DOC.id));
  return snap.exists() ? (snap.data() as AppSettings) : null;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const { db } = getFirebase();
  if (!db) return;
  await setDoc(doc(db, SETTINGS_DOC.col, SETTINGS_DOC.id), settings as unknown as Record<string, unknown>);
}

// ---------- Escritura ----------
export async function upsertDoc<T extends { id: string }>(name: CollectionName, item: T): Promise<void> {
  const { db } = getFirebase();
  if (!db) return;
  await setDoc(doc(db, COLLECTIONS[name], item.id), item as Record<string, unknown>);
}

export async function deleteDocById(name: CollectionName, id: string): Promise<void> {
  const { db } = getFirebase();
  if (!db) return;
  await deleteDoc(doc(db, COLLECTIONS[name], id));
}

export async function savePermissions(matrix: PermissionMatrix): Promise<void> {
  const { db } = getFirebase();
  if (!db) return;
  await setDoc(doc(db, META_DOC.col, META_DOC.id), matrix as Record<string, unknown>);
}

// ---------- Seed inicial ----------
/**
 * Sube los datos mock a Firestore. Idempotente (usa el mismo id).
 * Se ejecuta una sola vez desde /configuracion/seed (solo super_admin).
 */
export async function seedFirestore(onProgress?: (msg: string) => void, adminEmail?: string): Promise<void> {
  const { db } = getFirebase();
  if (!db) throw new Error("Firebase no está configurado.");

  const data: Record<CollectionName, { id: string }[]> = {
    users: mock.users,
    clientes: mock.clientes,
    destinos: mock.destinos,
    servicios: mock.servicios,
    costos: mock.costos,
    presupuestos: mock.presupuestos,
    ordenes: mock.ordenes,
    empleados: mock.empleados,
    pagosEmpleados: mock.pagosEmpleados,
    cobros: mock.cobros,
    notasAgenda: mock.notasAgenda,
  };

  for (const name of Object.keys(data) as CollectionName[]) {
    for (const item of data[name]) {
      await setDoc(doc(db, COLLECTIONS[name], item.id), item as Record<string, unknown>);
    }
    onProgress?.(`✓ ${name} (${data[name].length})`);
  }

  // Asegurar que TU cuenta quede como super_admin (por si usaste tu propio email)
  if (adminEmail && !mock.users.some((u) => u.email.toLowerCase() === adminEmail.toLowerCase())) {
    const adminUser: User = { id: uid("usr"), nombre: adminEmail, email: adminEmail, role: "super_admin", activo: true };
    await setDoc(doc(db, COLLECTIONS.users, adminUser.id), adminUser as unknown as Record<string, unknown>);
    onProgress?.("✓ tu usuario admin");
  }

  await savePermissions(mock.permissionMatrix);
  onProgress?.("✓ permisos");

  await saveSettings(mock.appSettings);
  onProgress?.("✓ configuración");
}
