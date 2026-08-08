"use client";

import { useRef, useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/ui/Modal";
import { useStore } from "@/components/providers/StoreProvider";
import { buildBackup, downloadBackup, restoreBackup, saveToFolder, supportsFolderSave, type BackupData } from "@/lib/backup";

function Card({ icon, title, subtitle, tone, children }: { icon: string; title: string; subtitle?: string; tone: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${tone}22`, color: tone }}>
          <Icon name={icon} size={18} />
        </span>
        <div>
          <h2 className="font-display text-base font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-content-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function BackupPage() {
  const store = useStore();
  const editable = store.can("configuracion", "edit");
  const fileRef = useRef<HTMLInputElement>(null);
  const [folder, setFolder] = useState<FileSystemDirectoryHandle | null>(null);
  const [folderName, setFolderName] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [pending, setPending] = useState<BackupData | null>(null);

  if (store.currentUser?.role !== "super_admin" && store.currentUser?.role !== "admin") {
    return <EmptyState icon="permisos" title="Sin acceso" description="El backup es solo para administradores." />;
  }

  const registros =
    store.clientes.length + store.destinos.length + store.servicios.length + store.presupuestos.length +
    store.ordenes.length + store.empleados.length + store.pagosEmpleados.length + store.cobros.length;

  const descargar = () => { downloadBackup(buildBackup(store)); setMsg("Backup descargado ✓"); };

  const elegirCarpeta = async () => {
    try {
      // @ts-expect-error showDirectoryPicker no está tipado en todos los TS
      const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
      setFolder(handle);
      setFolderName(handle.name);
      setMsg(`Carpeta "${handle.name}" seleccionada`);
    } catch {
      /* cancelado */
    }
  };

  const guardarEnCarpeta = async () => {
    if (!folder) return;
    try {
      await saveToFolder(folder, buildBackup(store));
      setMsg(`Backup guardado en "${folderName}" ✓`);
    } catch (e) {
      setMsg(`Error al guardar: ${(e as Error).message}`);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text()) as BackupData;
      if (parsed.app !== "el-faro-360") throw new Error("El archivo no es un backup de El Faro 360.");
      setPending(parsed);
    } catch (e2) {
      setMsg(`Archivo inválido: ${(e2 as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const confirmarRestore = () => {
    if (!pending) return;
    restoreBackup(store, pending);
    setMsg(`Restaurado desde backup del ${new Date(pending.exportedAt).toLocaleString("es-AR")} ✓`);
    setPending(null);
  };

  return (
    <Guard module="configuracion">
      <PageHeader title="Backup y restauración" subtitle="Respaldá y recuperá todos los datos del sistema" />

      {msg && (
        <div className="mb-4 rounded-lg border border-brand/40 bg-brand/10 px-4 py-2.5 text-sm text-brand">{msg}</div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <Badge tone={store.backend === "firebase" ? "green" : "gray"} dot>
          {store.backend === "firebase" ? "Firebase" : "Datos mock"}
        </Badge>
        <span className="text-sm text-content-muted">{registros} registros en el sistema</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Descargar */}
        <Card icon="config" title="Descargar backup" subtitle="Un archivo .json con todo el sistema" tone="#007FFF">
          <p className="mb-4 text-sm text-content-muted">
            Guarda clientes, destinos, servicios, presupuestos, órdenes, empleados, pagos, cobros y la configuración
            en un solo archivo. Sirve para restaurar más adelante.
          </p>
          <button className="btn-primary" onClick={descargar}>
            <Icon name="config" size={16} /> Descargar backup (.json)
          </button>
        </Card>

        {/* Carpeta local */}
        <Card icon="destinos" title="Carpeta en tu PC" subtitle="Guardar directo en una carpeta local" tone="#267D25">
          {supportsFolderSave() ? (
            <>
              <p className="mb-4 text-sm text-content-muted">
                Elegí una carpeta de tu computadora una vez y guardá los backups ahí con un clic
                {folderName && <> · carpeta actual: <b className="text-content">{folderName}</b></>}.
              </p>
              <div className="flex flex-wrap gap-2">
                <button className="btn-ghost" onClick={elegirCarpeta}><Icon name="destinos" size={16} /> Elegir carpeta</button>
                <button className="btn-primary" onClick={guardarEnCarpeta} disabled={!folder}><Icon name="check" size={16} /> Guardar acá</button>
              </div>
            </>
          ) : (
            <p className="text-sm text-content-muted">
              Tu navegador no soporta guardar en carpeta local. Usá <b>Chrome</b> o <b>Edge</b> en la computadora
              (o descargá el .json y guardalo donde quieras).
            </p>
          )}
        </Card>

        {/* Restaurar */}
        <Card icon="ordenes" title="Restaurar" subtitle="Cargar datos desde un backup .json" tone="#C85311">
          <p className="mb-4 text-sm text-content-muted">
            Subí un archivo de backup para recuperar los datos. Se agregan/actualizan por ID (no borra lo que ya existe).
          </p>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
          <button className="btn-ghost" onClick={() => fileRef.current?.click()} disabled={!editable}>
            <Icon name="arrowRight" size={16} /> Elegir archivo de backup
          </button>
        </Card>

        {/* Automático a Drive */}
        <Card icon="globe" title="Backup automático a Google Drive" subtitle="Programado, sin intervención" tone="#642A72">
          <p className="mb-3 text-sm text-content-muted">
            Un backup <b>automático</b> (todos los días, aunque no tengas la app abierta) necesita un proceso en la nube.
            Con Firebase se hace con <b>Cloud Functions programadas</b> (requiere el plan Blaze, con capa gratuita).
          </p>
          <p className="text-xs text-content-subtle">
            <Icon name="wand" size={13} className="mr-1 inline" />
            Es un paso aparte que armamos cuando quieras. Mientras tanto, la descarga manual y la carpeta local te cubren.
          </p>
        </Card>
      </div>

      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title="Confirmar restauración"
        size="sm"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setPending(null)}>Cancelar</button>
            <button className="btn-primary" onClick={confirmarRestore}>Restaurar</button>
          </>
        }
      >
        <p className="text-sm text-content-muted">
          Vas a restaurar el backup del{" "}
          <b className="text-content">{pending && new Date(pending.exportedAt).toLocaleString("es-AR")}</b>.
          Los registros con el mismo ID se sobrescriben. ¿Continuar?
        </p>
      </Modal>
    </Guard>
  );
}
