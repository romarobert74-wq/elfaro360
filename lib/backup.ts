import type { StoreValue } from "@/components/providers/store-context";

export interface BackupData {
  version: number;
  app: "el-faro-360";
  exportedAt: string;
  data: {
    users: unknown[];
    clientes: unknown[];
    destinos: unknown[];
    servicios: unknown[];
    costos: unknown[];
    presupuestos: unknown[];
    ordenes: unknown[];
    empleados: unknown[];
    pagosEmpleados: unknown[];
    cobros: unknown[];
  };
  settings: unknown;
}

/** Junta todo el estado del sistema en un objeto de backup. */
export function buildBackup(store: StoreValue): BackupData {
  return {
    version: 1,
    app: "el-faro-360",
    exportedAt: new Date().toISOString(),
    data: {
      users: store.users,
      clientes: store.clientes,
      destinos: store.destinos,
      servicios: store.servicios,
      costos: store.costos,
      presupuestos: store.presupuestos,
      ordenes: store.ordenes,
      empleados: store.empleados,
      pagosEmpleados: store.pagosEmpleados,
      cobros: store.cobros,
    },
    settings: store.settings,
  };
}

export function backupFilename(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `elfaro360-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.json`;
}

/** Descarga el backup como archivo .json (funciona en cualquier navegador). */
export function downloadBackup(backup: BackupData) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = backupFilename();
  a.click();
  URL.revokeObjectURL(url);
}

/** ¿El navegador soporta guardar directo en una carpeta local? (Chrome/Edge) */
export function supportsFolderSave(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

/** Guarda el backup dentro de un handle de carpeta ya elegido por el usuario. */
export async function saveToFolder(dirHandle: FileSystemDirectoryHandle, backup: BackupData) {
  const fileHandle = await dirHandle.getFileHandle(backupFilename(), { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(backup, null, 2));
  await writable.close();
}

/** Restaura los datos desde un backup (upsert: crea o actualiza por id). */
export function restoreBackup(store: StoreValue, backup: BackupData) {
  const d = backup.data;
  const upsert = <T extends { id: string }>(items: T[], current: T[], add: (x: T) => void, update: (x: T) => void) => {
    const ids = new Set(current.map((c) => c.id));
    items.forEach((it) => (ids.has(it.id) ? update(it) : add(it)));
  };
  upsert(d.clientes as never[], store.clientes, store.addCliente as never, store.updateCliente as never);
  upsert(d.destinos as never[], store.destinos, store.addDestino as never, store.updateDestino as never);
  upsert(d.servicios as never[], store.servicios, store.addServicio as never, store.updateServicio as never);
  upsert(d.costos as never[], store.costos, store.addCosto as never, store.updateCosto as never);
  upsert(d.presupuestos as never[], store.presupuestos, store.addPresupuesto as never, store.updatePresupuesto as never);
  upsert(d.ordenes as never[], store.ordenes, store.addOrden as never, store.updateOrden as never);
  upsert(d.empleados as never[], store.empleados, store.addEmpleado as never, store.updateEmpleado as never);
  upsert(d.pagosEmpleados as never[], store.pagosEmpleados, store.addPago as never, store.updatePago as never);
  upsert(d.cobros as never[], store.cobros, store.addCobro as never, store.updateCobro as never);
  upsert(d.users as never[], store.users, store.addUser as never, store.updateUser as never);
  if (backup.settings) store.updateSettings(backup.settings as never);
}
